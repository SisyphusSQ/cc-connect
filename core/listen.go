package core

import (
	"net"
	"strconv"
	"strings"
)

const defaultLocalListenHost = "127.0.0.1"

func normalizeListenHost(host string) string {
	host = strings.TrimSpace(host)
	if host == "" {
		return defaultLocalListenHost
	}
	return host
}

func listenAddr(host string, port int) string {
	host = normalizeListenHost(host)
	if host == "*" {
		return ":" + strconv.Itoa(port)
	}
	return net.JoinHostPort(host, strconv.Itoa(port))
}
