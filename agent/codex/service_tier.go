package codex

import (
	"encoding/json"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/BurntSushi/toml"

	"github.com/chenhg5/cc-connect/core"
)

type codexServiceTierMetadata struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type codexModelServiceTierMetadata struct {
	Slug                 string                     `json:"slug"`
	DisplayName          string                     `json:"display_name"`
	ServiceTiers         []codexServiceTierMetadata `json:"service_tiers"`
	AdditionalSpeedTiers []string                   `json:"additional_speed_tiers"`
}

func normalizeServiceTier(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "", "default", "standard", "auto":
		if strings.TrimSpace(raw) == "" {
			return ""
		}
		return "default"
	case "fast", "priority":
		return "priority"
	default:
		return strings.ToLower(strings.TrimSpace(raw))
	}
}

func readCodexConfiguredServiceTier(codexHome string) string {
	var cfg struct {
		ServiceTier string `toml:"service_tier"`
	}
	path := filepath.Join(resolveCodexHomeDir(codexHome), "config.toml")
	if _, err := toml.DecodeFile(path, &cfg); err != nil {
		return ""
	}
	return normalizeServiceTier(cfg.ServiceTier)
}

func readCodexConfiguredModel(codexHome string) string {
	var cfg struct {
		Model string `toml:"model"`
	}
	path := filepath.Join(resolveCodexHomeDir(codexHome), "config.toml")
	if _, err := toml.DecodeFile(path, &cfg); err != nil {
		return ""
	}
	return strings.TrimSpace(cfg.Model)
}

func availableCodexServiceTiers(codexHome, model, current string) []core.ServiceTierOption {
	current = normalizeServiceTier(current)
	if strings.TrimSpace(model) == "" {
		model = readCodexConfiguredModel(codexHome)
	}
	options := []core.ServiceTierOption{{
		ID:      "default",
		Aliases: []string{"standard", "auto"},
	}}

	metadata, ok := readCodexModelServiceTierMetadata(codexHome, model)
	if ok {
		for _, tier := range metadata.ServiceTiers {
			id := normalizeServiceTier(tier.ID)
			if id == "" || id == "default" || serviceTierOptionIndex(options, id) >= 0 {
				continue
			}
			name := strings.TrimSpace(tier.Name)
			if name == "" {
				name = id
			}
			options = append(options, core.ServiceTierOption{
				ID:          id,
				Name:        name,
				Description: strings.TrimSpace(tier.Description),
			})
		}
		attachCodexSpeedAliases(options, metadata.AdditionalSpeedTiers)
	}

	if current != "" && serviceTierOptionIndex(options, current) < 0 {
		options = append(options, core.ServiceTierOption{ID: current, Name: current})
	}
	return options
}

func serviceTierOptionIndex(options []core.ServiceTierOption, id string) int {
	for i := range options {
		if strings.EqualFold(options[i].ID, id) {
			return i
		}
	}
	return -1
}

func attachCodexSpeedAliases(options []core.ServiceTierOption, aliases []string) {
	for _, raw := range aliases {
		alias := strings.ToLower(strings.TrimSpace(raw))
		if alias == "" {
			continue
		}
		idx := -1
		for i := 1; i < len(options); i++ {
			if strings.EqualFold(options[i].Name, alias) || strings.EqualFold(options[i].ID, alias) {
				idx = i
				break
			}
		}
		if idx < 0 && len(options) == 2 {
			idx = 1
		}
		if idx >= 0 && !containsFold(options[idx].Aliases, alias) {
			options[idx].Aliases = append(options[idx].Aliases, alias)
		}
	}
}

func containsFold(values []string, target string) bool {
	for _, value := range values {
		if strings.EqualFold(value, target) {
			return true
		}
	}
	return false
}

func readCodexModelServiceTierMetadata(codexHome, model string) (codexModelServiceTierMetadata, bool) {
	home := resolveCodexHomeDir(codexHome)
	paths := codexServiceTierCatalogPaths(home)
	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		if metadata, ok := parseCodexModelServiceTierMetadata(data, model); ok {
			return metadata, true
		}
	}
	return codexModelServiceTierMetadata{}, false
}

func codexServiceTierCatalogPaths(codexHome string) []string {
	var paths []string
	var cfg struct {
		ModelCatalogJSON string `toml:"model_catalog_json"`
	}
	if _, err := toml.DecodeFile(filepath.Join(codexHome, "config.toml"), &cfg); err == nil {
		if path := resolveCodexCatalogPath(codexHome, cfg.ModelCatalogJSON); path != "" {
			paths = append(paths, path)
		}
	}
	paths = append(paths, filepath.Join(codexHome, "models_cache.json"))
	return paths
}

func resolveCodexCatalogPath(codexHome, raw string) string {
	path := strings.TrimSpace(raw)
	if path == "" {
		return ""
	}
	if path == "~" || strings.HasPrefix(path, "~/") {
		home, err := os.UserHomeDir()
		if err != nil {
			return ""
		}
		if path == "~" {
			return home
		}
		return filepath.Join(home, path[2:])
	}
	if !filepath.IsAbs(path) {
		return filepath.Join(codexHome, path)
	}
	return path
}

func parseCodexModelServiceTierMetadata(data []byte, model string) (codexModelServiceTierMetadata, bool) {
	var payload struct {
		Models []codexModelServiceTierMetadata `json:"models"`
	}
	if err := json.Unmarshal(data, &payload); err != nil {
		slog.Debug("codex: failed to parse service tier model metadata", "error", err)
		return codexModelServiceTierMetadata{}, false
	}
	wanted := strings.TrimSpace(model)
	if wanted == "" {
		return codexModelServiceTierMetadata{}, false
	}
	for _, metadata := range payload.Models {
		name := strings.TrimSpace(metadata.Slug)
		if name == "" {
			name = strings.TrimSpace(metadata.DisplayName)
		}
		if strings.EqualFold(name, wanted) {
			return metadata, true
		}
	}
	return codexModelServiceTierMetadata{}, false
}
