class NetworkRulesEngine:
    @staticmethod
    def analyze(parsed_data: dict) -> list:
        findings = []
        
        # 1. Hostname Check
        if parsed_data.get("hostname") == "Unknown":
            findings.push({
                "type": "Config",
                "issue": "Default Device Hostname",
                "severity": "Info",
                "impact": "No unique device identifier configured. Can cause logging overlaps and identification confusion in SNMP and log management consoles.",
                "explanation": "Default hostname is not changed to site naming conventions.",
                "suggestedFix": "Change the hostname of the device in global configuration mode.",
                "cliCommand": "hostname [SITE-BUILDING-ROLE-ID]"
            })

        # 2. Security Configuration Audits
        sec = parsed_data.get("security", {})
        if sec.get("telnet_enabled"):
            findings.append({
                "type": "Security",
                "issue": "Insecure Telnet Protocol Enabled",
                "severity": "Critical",
                "impact": "Telnet transmits all sessions (including user login passwords) in clear plaintext, making it highly vulnerable to packet sniffing and credential theft.",
                "explanation": "Active Telnet listeners detected. Admin access should exclusively rely on encrypted SSH tunnels.",
                "suggestedFix": "Configure virtual terminal lines to accept SSH connections only.",
                "cliCommand": "line vty 0 15\n transport input ssh"
            })
            
        if not sec.get("ssh_enabled") and not sec.get("telnet_enabled"):
            findings.append({
                "type": "Security",
                "issue": "No Remote Admin Protocols Configured",
                "severity": "Warning",
                "impact": "Engineers cannot connect to manage the system remotely except via local physical console cabling.",
                "explanation": "Line virtual terminal is either shut down or lacks allowed protocols.",
                "suggestedFix": "Generate cryptographic RSA host keys and enable SSH transport input.",
                "cliCommand": "ip domain-name local.domain\ncrypto key generate rsa\nline vty 0 15\n transport input ssh"
            })
            
        if len(sec.get("plaintext_passwords", [])) > 0:
            findings.append({
                "type": "Security",
                "issue": "Plaintext Privilege Password Stored",
                "severity": "Critical",
                "impact": "Plaintext password storage allows anyone with temporary TFTP configuration backup reads to view the core administrative password.",
                "explanation": "Plaintext password used in 'enable password' configuration.",
                "suggestedFix": "Disable the weak plaintext enable password and configure a strong enable secret (which uses secure hash functions).",
                "cliCommand": "no enable password\nenable secret [SECURE_RANDOM_HASH_HERE]"
            })

        # 3. Routing Checks
        routing = parsed_data.get("routing", {})
        if routing.get("ospf"):
            # Check OSPF networks
            networks = routing.get("networks", [])
            if not networks:
                findings.append({
                    "type": "Routing",
                    "issue": "OSPF Active Lacking Interface Network Statements",
                    "severity": "Warning",
                    "impact": "OSPF process is spawned but no active physical interfaces are bound to any area. No routing adjacencies will form.",
                    "explanation": "The OSPF config blocks lack network directives matching active subnets.",
                    "suggestedFix": "Define OSPF network blocks matching the local subnets.",
                    "cliCommand": "router ospf 1\n network [LOCAL_SUBNET_IP] [WILDCARD_MASK] area 0"
                })
                
        static_routes = routing.get("static_routes", [])
        has_default_route = False
        for route in static_routes:
            dest = route.get("destination")
            mask = route.get("mask")
            next_hop = route.get("next_hop")
            
            # Check default route
            if dest in ["0.0.0.0", "default"]:
                has_default_route = True
                
            # Check loop route configuration (next hop is loopback/self ip)
            if next_hop == "127.0.0.1":
                findings.append({
                    "type": "Routing",
                    "issue": "Static Route Pointing to Local Loopback",
                    "severity": "Critical",
                    "impact": "Configuring a static route pointing to localhost loopback triggers local loop loops and packet dropping.",
                    "explanation": "Static IP route configured with localhost next-hop.",
                    "suggestedFix": "Change the next hop to a valid gateway ip or egress physical interface.",
                    "cliCommand": "no ip route [SUBNET] [MASK] 127.0.0.1"
                })

        if not has_default_route and parsed_data.get("hostname") != "Unknown":
            findings.append({
                "type": "Routing",
                "issue": "Missing Default Route Gateway",
                "severity": "Warning",
                "impact": "The core switch/router cannot forward packets targeting external networks (e.g. cloud instances, other branches) unless learned dynamically.",
                "explanation": "No default gateway route (0.0.0.0/0) detected in configuration blocks.",
                "suggestedFix": "Add a default route entry directing packets to next-hop firewall or ISP ip.",
                "cliCommand": "ip route 0.0.0.0 0.0.0.0 [GATEWAY_IP]"
            })

        # 4. DHCP & DNS Checks
        dhcp = parsed_data.get("dhcp_pools", [])
        dns = parsed_data.get("dns_servers", [])
        
        if dhcp and not dns:
            findings.append({
                "type": "DHCP",
                "issue": "DHCP Pools Configured Without DNS Configurations",
                "severity": "Warning",
                "impact": "Clients leased via DHCP will receive IP parameters but will fail domain name conversions, causing browsing outages.",
                "explanation": "No corporate or global DNS server address set inside the active DHCP pools.",
                "suggestedFix": "Add name-server addresses to the DHCP lease pool configurations.",
                "cliCommand": "ip dhcp pool [POOL_NAME]\n dns-server 8.8.8.8 1.1.1.1"
            })
            
        # 5. Interface Errors/Mismatch Simulations (if telemetry metrics exist)
        interfaces = parsed_data.get("interfaces", [])
        for face in interfaces:
            desc = face.get("description", "").lower()
            name = face.get("name", "")
            
            # Duplex mismatch rule simulation based on naming
            if "duplex" in desc or "half-duplex" in desc:
                findings.append({
                    "type": "VLAN",
                    "issue": f"Interface Duplex Config Mismatch Alert on {name}",
                    "severity": "Warning",
                    "impact": "Forced half-duplex configurations on modern switches cause ethernet collision storms, slow download links, and heavy frame drops.",
                    "explanation": "Configuration descriptions flag active speed/duplex force lock. Let port run auto-negotiation.",
                    "suggestedFix": "Reset duplex/speed modes to auto-negotiate settings on the interface.",
                    "cliCommand": f"interface {name}\n duplex auto\n speed auto"
                })

        # Default fallback
        if not findings:
            findings.append({
                "type": "Config",
                "issue": "No Configuration Anomalies Detected",
                "severity": "Info",
                "impact": "No vulnerabilities or misconfigurations detected by rule engine.",
                "explanation": "Device parameters fall within enterprise base guidelines.",
                "suggestedFix": "Audit and archive configuration backup logs.",
                "cliCommand": "write memory"
            })

        return findings
