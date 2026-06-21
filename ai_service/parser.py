import re

class NetworkConfigParser:
    @staticmethod
    def parse_cisco(text: str) -> dict:
        data = {
            "hostname": "Unknown",
            "interfaces": [],
            "routing": {"ospf": False, "bgp": False, "static_routes": [], "networks": []},
            "security": {"telnet_enabled": False, "plaintext_passwords": [], "ssh_enabled": False},
            "vlans": [],
            "dhcp_pools": [],
            "dns_servers": []
        }
        
        # Extract Hostname
        host_match = re.search(r"hostname\s+(\S+)", text, re.IGNORECASE)
        if host_match:
            data["hostname"] = host_match.group(1)
            
        # Parse Interfaces
        interface_blocks = re.findall(r"interface\s+(\S+)(.*?)(?=\ninterface|\n!|\n\n|$)", text, re.DOTALL | re.IGNORECASE)
        for name, body in interface_blocks:
            ip_match = re.search(r"ip\s+address\s+(\S+)\s+(\S+)", body, re.IGNORECASE)
            shutdown = "shutdown" in body.lower()
            desc_match = re.search(r"description\s+(.*)", body, re.IGNORECASE)
            
            data["interfaces"].append({
                "name": name,
                "ip_address": f"{ip_match.group(1)} {ip_match.group(2)}" if ip_match else "Unassigned",
                "status": "Shutdown" if shutdown else "Up/Active",
                "description": desc_match.group(1).strip() if desc_match else ""
            })
            
        # Parse routing processes
        if re.search(r"router\s+ospf", text, re.IGNORECASE):
            data["routing"]["ospf"] = True
            
        if re.search(r"router\s+bgp", text, re.IGNORECASE):
            data["routing"]["bgp"] = True
            
        # Parse networks under routing
        networks = re.findall(r"network\s+([\d\.]+)\s+([\d\.]+)\s+area\s+(\d+)", text, re.IGNORECASE)
        for net, mask, area in networks:
            data["routing"]["networks"].append({"subnet": net, "wildcard": mask, "area": int(area)})
            
        # Parse static routes
        static_matches = re.findall(r"ip\s+route\s+(\S+)\s+(\S+)\s+(\S+)", text, re.IGNORECASE)
        for dest, mask, next_hop in static_matches:
            data["routing"]["static_routes"].append({"destination": dest, "mask": mask, "next_hop": next_hop})
            
        # Parse security
        if re.search(r"transport\s+input\s+.*telnet", text, re.IGNORECASE) or (
            re.search(r"line\s+vty", text, re.IGNORECASE) and not re.search(r"transport\s+input\s+(ssh|none)", text, re.IGNORECASE)
        ):
            data["security"]["telnet_enabled"] = True
            
        if re.search(r"ip\s+ssh\s+version", text, re.IGNORECASE) or re.search(r"crypto\s+key\s+generate\s+rsa", text, re.IGNORECASE):
            data["security"]["ssh_enabled"] = True
            
        plaintext_pwds = re.findall(r"enable\s+password\s+(\S+)", text, re.IGNORECASE)
        for pwd in plaintext_pwds:
            data["security"]["plaintext_passwords"].append(pwd)
            
        # Parse DHCP Pools
        dhcp_pools = re.findall(r"ip\s+dhcp\s+pool\s+(\S+)", text, re.IGNORECASE)
        for pool in dhcp_pools:
            data["dhcp_pools"].append({"pool_name": pool})
            
        # Parse DNS
        dns = re.findall(r"ip\s+name-server\s+(.*)", text, re.IGNORECASE)
        for server in dns:
            data["dns_servers"].extend(server.split())
            
        return data

    @staticmethod
    def parse_juniper(text: str) -> dict:
        data = {
            "hostname": "Unknown",
            "interfaces": [],
            "routing": {"ospf": False, "bgp": False, "static_routes": []},
            "security": {"telnet_enabled": False, "plaintext_passwords": [], "ssh_enabled": False},
            "vlans": []
        }
        
        # Simple structural parsing for Juniper configuration format
        host_match = re.search(r"host-name\s+(\S+);", text, re.IGNORECASE)
        if host_match:
            data["hostname"] = host_match.group(1)
            
        # Find interfaces
        interface_blocks = re.findall(r"interfaces\s+{(\s+\S+\s+{[\s\S]*?}\s+)}", text, re.IGNORECASE)
        if interface_blocks:
            int_body = interface_blocks[0]
            names = re.findall(r"(\S+)\s+{([\s\S]*?)}", int_body)
            for name, body in names:
                if "unit" in body:
                    ip_match = re.search(r"address\s+(\S+);", body, re.IGNORECASE)
                    disable = "disable;" in body.lower()
                    data["interfaces"].append({
                        "name": name,
                        "ip_address": ip_match.group(1) if ip_match else "Unassigned",
                        "status": "Shutdown" if disable else "Up/Active",
                        "description": re.search(r"description\s+\"(.*?)\";", body, re.IGNORECASE).group(1) if re.search(r"description\s+\"(.*?)\";", body, re.IGNORECASE) else ""
                    })

        if "protocols ospf" in text.lower():
            data["routing"]["ospf"] = True
        if "protocols bgp" in text.lower():
            data["routing"]["bgp"] = True
            
        # Static routes
        static_matches = re.findall(r"route\s+(\S+)\s+next-hop\s+(\S+);", text, re.IGNORECASE)
        for dest, next_hop in static_matches:
            data["routing"]["static_routes"].append({"destination": dest, "next_hop": next_hop})
            
        # Security
        if "ssh" in text.lower():
            data["security"]["ssh_enabled"] = True
        if "telnet" in text.lower():
            data["security"]["telnet_enabled"] = True

        return data

    @staticmethod
    def parse_nokia(text: str) -> dict:
        # Simple parser for Nokia SRL / Router configuration format
        data = {
            "hostname": "Unknown",
            "interfaces": [],
            "routing": {"ospf": False, "bgp": False, "static_routes": []},
            "security": {"telnet_enabled": False, "plaintext_passwords": [], "ssh_enabled": False}
        }
        
        host_match = re.search(r"system-name\s+(\S+)", text, re.IGNORECASE)
        if host_match:
            data["hostname"] = host_match.group(1)

        # Parse interfaces
        interface_blocks = re.findall(r"interface\s+(\S+)\s+{(.*?)}", text, re.DOTALL)
        for name, body in interface_blocks:
            ip_match = re.search(r"ipv4-address\s+(\S+)", body)
            admin_state = re.search(r"admin-state\s+(\S+)", body)
            shutdown = admin_state.group(1).lower() == "disable" if admin_state else False
            
            data["interfaces"].append({
                "name": name,
                "ip_address": ip_match.group(1) if ip_match else "Unassigned",
                "status": "Shutdown" if shutdown else "Up/Active",
                "description": ""
            })

        if "ospf" in text.lower():
            data["routing"]["ospf"] = True
        if "bgp" in text.lower():
            data["routing"]["bgp"] = True
            
        return data
