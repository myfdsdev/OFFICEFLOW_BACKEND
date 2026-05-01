import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAppSettings } from '@/lib/AppSettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Save, Image as ImageIcon, Type } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AppSettingsForm() {
  const { settings, updateSettings } = useAppSettings();

  const [formData, setFormData] = useState({
    app_name: '',
    app_logo: '',
    html_title: '',
    favicon: '',
    primary_color: '#6366F1',
  });

  const [originalData, setOriginalData] = useState({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const data = {
      app_name: settings?.app_name || 'AttendEase',
      app_logo: settings?.app_logo || '',
      html_title: settings?.html_title || 'AttendEase',
      favicon: settings?.favicon || '',
      primary_color: settings?.primary_color || '#6366F1',
    };

    setFormData(data);
    setOriginalData(data);
  }, [settings]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large (max 2MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const setLoading = field === 'app_logo' ? setUploadingLogo : setUploadingFavicon;
    setLoading(true);

    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = result?.file_url || result?.url || result?.secure_url;

      if (!fileUrl) {
        toast.error('Upload returned no URL');
        return;
      }

      setFormData((prev) => ({ ...prev, [field]: fileUrl }));
      toast.success(`${field === 'app_logo' ? 'Logo' : 'Favicon'} uploaded — click Save to apply`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await updateSettings(formData);
      setOriginalData(formData);
      toast.success('App settings saved successfully');
    } catch (error) {
      toast.error(
        'Failed to save: ' +
          (error?.response?.data?.error || error?.message || 'Unknown error')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(originalData);
    toast('Reset to last saved');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5 text-lime-400" />
            App Identity
          </CardTitle>
          <CardDescription>
            Customize how your app appears to users
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>App Name</Label>
            <Input
              value={formData.app_name}
              onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
              placeholder="e.g. AttendEase"
              className="border border-lime-400/10"
            />
            <p className="text-xs text-gray-500">
              Shown in the sidebar and login page
            </p>
          </div>

          <div className="space-y-2">
            <Label>Browser Tab Title</Label>
            <Input
              value={formData.html_title}
              onChange={(e) => setFormData({ ...formData, html_title: e.target.value })}
              placeholder="e.g. AttendEase - Workforce Management"
              className="border border-lime-400/10"
            />
            <p className="text-xs text-gray-500">
              Shown in the browser tab title
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-lime-400" />
            App Logo
          </CardTitle>
          <CardDescription>
            Upload your company logo shown in the sidebar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 rounded-xl border-2 border-lime-400/10">
              {formData.app_logo ? (
                <AvatarImage src={formData.app_logo} alt="Logo" className="object-contain" />
              ) : (
                <AvatarFallback className="bg-black text-lime-400 rounded-xl">
                  <ImageIcon className="w-8 h-8" />
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'app_logo')}
                className="hidden"
                id="logo-upload"
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingLogo}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="bg-black"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingLogo ? 'Uploading...' : formData.app_logo ? 'Change Logo' : 'Upload Logo'}
                </Button>

                {formData.app_logo && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFormData({ ...formData, app_logo: '' })}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Square image recommended, max 2MB. PNG with transparent background works best.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-lime-400" />
            Browser Favicon
          </CardTitle>
          <CardDescription>
            Small icon shown in the browser tab
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-lg border-2 border-lime-400/10 flex items-center justify-center bg-black">
              {formData.favicon ? (
                <img src={formData.favicon} alt="Favicon" className="w-12 h-12 object-contain" />
              ) : (
                <ImageIcon className="w-8 h-8 text-lime-400" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'favicon')}
                className="hidden"
                id="favicon-upload"
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingFavicon}
                  onClick={() => document.getElementById('favicon-upload')?.click()}
                  className="bg-black"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingFavicon ? 'Uploading...' : formData.favicon ? 'Change Favicon' : 'Upload Favicon'}
                </Button>

                {formData.favicon && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFormData({ ...formData, favicon: '' })}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Square 32x32 or 64x64, max 2MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-2">
        {isDirty && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="bg-lime-400 text-black"
          >
            Reset Changes
          </Button>
        )}

        <Button
          onClick={handleSave}
          disabled={saving || !isDirty}
          size="lg"
          className="bg-lime-400 text-black hover:bg-lime-400"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Saving...' : isDirty ? 'Save App Settings' : 'No Changes'}
        </Button>
      </div>
    </div>
  );
}