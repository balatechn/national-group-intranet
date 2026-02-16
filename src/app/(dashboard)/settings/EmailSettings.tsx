'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Server,
  Lock,
  User,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Send,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from '@/components/ui';

interface EmailConfig {
  smtp_enabled: string;
  smtp_host: string;
  smtp_port: string;
  smtp_secure: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from_email: string;
  smtp_from_name: string;
}

const defaultConfig: EmailConfig = {
  smtp_enabled: 'false',
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_secure: 'false',
  smtp_user: '',
  smtp_pass: '',
  smtp_from_email: '',
  smtp_from_name: 'National Group Intranet',
};

export default function EmailSettings() {
  const [config, setConfig] = useState<EmailConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings/email');
      if (res.ok) {
        const data = await res.json();
        setConfig({ ...defaultConfig, ...data });
      }
    } catch (error) {
      console.error('Failed to fetch email config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof EmailConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Email settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, action: 'test-connection' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'SMTP connection successful! Server is reachable.' });
      } else {
        setMessage({ type: 'error', text: `Connection failed: ${data.error}` });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to test connection' });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Please enter a test email address' });
      return;
    }
    setSendingTest(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, action: 'send-test', test_email: testEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Test email sent successfully to ${testEmail}!` });
      } else {
        setMessage({ type: 'error', text: `Failed to send: ${data.error}` });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to send test email' });
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEnabled = config.smtp_enabled === 'true';

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Google SMTP Setup</p>
          <p className="mt-1">
            To use Gmail SMTP, enable 2-Step Verification on your Google account, then create an{' '}
            <strong>App Password</strong> at{' '}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              myaccount.google.com/apppasswords
            </a>
            . Use that app password (not your Gmail password) in the SMTP Password field below.
          </p>
        </div>
      </div>

      {/* SMTP Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              SMTP Configuration
            </div>
            {/* Enable/Disable Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className={`text-sm font-normal ${isEnabled ? 'text-green-600' : 'text-text-muted'}`}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
                onClick={() => handleChange('smtp_enabled', isEnabled ? 'false' : 'true')}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Server Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5" />
                SMTP Host
              </Label>
              <Input
                value={config.smtp_host}
                onChange={(e) => handleChange('smtp_host', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Port</Label>
              <Input
                type="number"
                value={config.smtp_port}
                onChange={(e) => handleChange('smtp_port', e.target.value)}
                placeholder="587"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Security</Label>
              <select
                value={config.smtp_secure}
                onChange={(e) => handleChange('smtp_secure', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="false">STARTTLS (Port 587)</option>
                <option value="true">SSL/TLS (Port 465)</option>
              </select>
            </div>
          </div>

          {/* Auth Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                SMTP Username / Email
              </Label>
              <Input
                value={config.smtp_user}
                onChange={(e) => handleChange('smtp_user', e.target.value)}
                placeholder="your-email@gmail.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                SMTP Password / App Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={config.smtp_pass}
                  onChange={(e) => handleChange('smtp_pass', e.target.value)}
                  placeholder="App password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* From Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                From Email Address
              </Label>
              <Input
                type="email"
                value={config.smtp_from_email}
                onChange={(e) => handleChange('smtp_from_email', e.target.value)}
                placeholder="noreply@nationalgroupindia.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">From Display Name</Label>
              <Input
                value={config.smtp_from_name}
                onChange={(e) => handleChange('smtp_from_name', e.target.value)}
                placeholder="National Group Intranet"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Test & Send Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-5 w-5" />
            Test Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !config.smtp_user}
              className="gap-2"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              Test Connection
            </Button>

            <div className="flex flex-1 gap-2">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email to send test..."
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleSendTestEmail}
                disabled={sendingTest || !testEmail || !config.smtp_user}
                className="gap-2 whitespace-nowrap"
              >
                {sendingTest ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2 px-8">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Email Settings
        </Button>
      </div>
    </div>
  );
}
