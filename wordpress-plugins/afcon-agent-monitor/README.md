# AFCON Agent Monitor WordPress Plugin

Monitor and control the AFCON 2025 AI Agent running on DigitalOcean from your WordPress admin dashboard.

## Features

- **Real-time Monitoring**: View agent status, uptime, and activity
- **Remote Control**: Start, stop, and restart the agent via SSH
- **Live Logs**: View and search agent logs with auto-refresh
- **Statistics**: Track events found, articles published, and more
- **Dashboard Widget**: Quick status view on WordPress main dashboard
- **Secure**: Encrypted SSH credential storage

## Requirements

- PHP 7.4 or higher
- WordPress 5.8 or higher
- SSH access to DigitalOcean droplet running the AFCON agent
- Sudo privileges on the droplet for systemctl commands

## Installation

### 1. Upload Plugin

Upload the `afcon-agent-monitor` folder to your WordPress plugins directory:

```
/wp-content/plugins/afcon-agent-monitor/
```

### 2. Activate Plugin

Go to **Plugins** in WordPress admin and activate "AFCON Agent Monitor".

### 3. Configure SSH Connection

1. Go to **AFCON Agent** → **Settings** tab
2. Enter your SSH connection details:
   - SSH Host: `159.223.103.16` (or your droplet IP)
   - SSH Port: `22`
   - Username: `root`
   - Authentication Method: Choose SSH Key or Password

#### SSH Key Authentication (Recommended)

1. On your local machine, generate an SSH key if you don't have one:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "wordpress@afriquesports.net"
   ```

2. Copy the private key:
   ```bash
   cat ~/.ssh/id_rsa
   ```

3. Paste the entire private key into the "SSH Private Key" field in WordPress

4. Add the public key to your droplet:
   ```bash
   ssh root@159.223.103.16
   cat >> ~/.ssh/authorized_keys
   # Paste your public key (from ~/.ssh/id_rsa.pub)
   # Press Ctrl+D
   ```

#### Password Authentication

Simply enter your SSH password in the "SSH Password" field. It will be encrypted when saved.

### 4. Test Connection

Click the "Test Connection" button to verify your SSH settings work correctly.

### 5. Save Settings

Click "Save Settings" to store your configuration.

## Usage

### Dashboard Tab

View agent status and quick controls:
- **Status Indicator**: Green (running) or Red (stopped)
- **Uptime**: How long the agent has been running
- **Today's Activity**: Events found and articles published
- **Recent Logs**: Last 10 log lines
- **Control Buttons**: Start, Stop, Restart agent

### Logs Tab

View and search agent logs:
- **Auto-Refresh**: Updates every 5 seconds (configurable)
- **Search**: Filter logs by keyword
- **Lines**: Choose how many lines to display (50-500)
- **Real-time**: See logs as they're written

### Statistics Tab

View detailed statistics:
- Total events found today
- Total articles published today
- Total ESPN checks performed

### Settings Tab

Configure plugin settings:
- SSH connection details
- Authentication method (key or password)
- Auto-refresh intervals
- Activity log (last 100 actions)

## Security

- **Encrypted Credentials**: SSH keys and passwords are encrypted using WordPress salts
- **Admin Only**: Only users with `manage_options` capability can access
- **Nonce Protection**: All AJAX requests use WordPress nonces
- **Secure Commands**: All SSH commands are sanitized and validated

## Troubleshooting

### Connection Failed

- Verify SSH credentials are correct
- Check that droplet is running and accessible
- Ensure firewall allows SSH connections
- Test SSH connection manually: `ssh root@159.223.103.16`

### Agent Not Starting

- Check agent is installed on droplet: `ssh root@159.223.103.16 "systemctl status afcon-agent"`
- View agent error logs: `ssh root@159.223.103.16 "tail -50 /var/log/afcon-agent-error.log"`
- Verify agent files exist: `ssh root@159.223.103.16 "ls -la /opt/afcon-agent/"`

### Permission Denied

- Ensure user has sudo access without password prompt
- Add to sudoers: `echo "root ALL=(ALL) NOPASSWD: /bin/systemctl" >> /etc/sudoers.d/afcon`

### Logs Not Showing

- Verify log file exists: `ssh root@159.223.103.16 "ls -la /var/log/afcon-agent.log"`
- Check log file permissions: `ssh root@159.223.103.16 "chmod 644 /var/log/afcon-agent.log"`

## Technical Details

### SSH Library

Uses **phpseclib 3.0** for pure PHP SSH connections. No system dependencies required.

### AJAX Endpoints

- `afcon_get_status` - Get agent status
- `afcon_start_agent` - Start the agent
- `afcon_stop_agent` - Stop the agent
- `afcon_restart_agent` - Restart the agent
- `afcon_get_logs` - Fetch agent logs
- `afcon_get_statistics` - Get statistics
- `afcon_test_connection` - Test SSH connection

### Caching

- Dashboard data cached for 3 seconds (WordPress transients)
- Reduces SSH connections when multiple admins view dashboard

### Activity Logging

All plugin actions are logged:
- Timestamp
- Action performed
- User who performed action
- Success/failure status
- Error message (if applicable)

Last 100 actions are stored in WordPress options table.

## Support

For issues or questions:
- Email: oxmo88@gmail.com
- Check agent deployment guide: See AFCON agent README

## Credits

- **Developed for**: Afrique Sports (afriquesports.net)
- **AFCON Agent**: Monitors AFCON 2025 matches via ESPN API
- **SSH Library**: phpseclib 3.0 (phpseclib.com)

## License

GPL v2 or later

---

**Built for AFCON 2025** 🚀⚽
