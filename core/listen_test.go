package core

import "testing"

func TestListenAddr_DefaultsToLoopback(t *testing.T) {
	if got, want := listenAddr("", 9820), "127.0.0.1:9820"; got != want {
		t.Fatalf("listenAddr() = %q, want %q", got, want)
	}
}

func TestListenAddr_SupportsExplicitAllInterfaces(t *testing.T) {
	if got, want := listenAddr("*", 9820), ":9820"; got != want {
		t.Fatalf("listenAddr() = %q, want %q", got, want)
	}
}

func TestListenAddr_FormatsIPv6(t *testing.T) {
	if got, want := listenAddr("::1", 9820), "[::1]:9820"; got != want {
		t.Fatalf("listenAddr() = %q, want %q", got, want)
	}
}

func TestManagementAndBridge_DefaultToLoopback(t *testing.T) {
	management := NewManagementServer(9820, "token", nil)
	if management.listenHost != defaultLocalListenHost {
		t.Fatalf("management listen host = %q, want %q", management.listenHost, defaultLocalListenHost)
	}

	bridge := NewBridgeServer(9810, "token", "/bridge/ws", nil)
	if bridge == nil {
		t.Fatal("NewBridgeServer() returned nil")
	}
	if bridge.listenHost != defaultLocalListenHost {
		t.Fatalf("bridge listen host = %q, want %q", bridge.listenHost, defaultLocalListenHost)
	}
}

func TestManagementAndBridge_AllowExplicitListenHost(t *testing.T) {
	management := NewManagementServer(9820, "token", nil)
	management.SetListenHost("0.0.0.0")
	if management.listenHost != "0.0.0.0" {
		t.Fatalf("management listen host = %q, want 0.0.0.0", management.listenHost)
	}

	bridge := NewBridgeServer(9810, "token", "/bridge/ws", nil)
	bridge.SetListenHost("::1")
	if bridge.listenHost != "::1" {
		t.Fatalf("bridge listen host = %q, want ::1", bridge.listenHost)
	}
}
