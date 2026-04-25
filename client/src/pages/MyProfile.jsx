import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { User, Mail, Phone, Building, IdCard, Shield, Upload, Save } from "lucide-react";
import { toast } from "react-hot-toast";

const departments = [
  "Video Editor",
  "Graphic Designer",
  "Web Designer",
  "Content Writer",
  "Developer"
];

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    mobile_number: '',
    employee_id: '',
    department: '',
    profile_photo: '',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth.me().then((userData) => {
      setUser(userData);
      setFormData({
        mobile_number: userData?.mobile_number || '',
        employee_id: userData?.employee_id || '',
        department: userData?.department || '',
        profile_photo: userData?.profile_photo || '',
      });
    }).catch(() => {});
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: (updatedUser) => {
      console.log('[MyProfile] Update success:', updatedUser);
      setUser(updatedUser);
      setFormData({
        mobile_number: updatedUser?.mobile_number || '',
        employee_id: updatedUser?.employee_id || '',
        department: updatedUser?.department || '',
        profile_photo: updatedUser?.profile_photo || '',
      });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      console.error('[MyProfile] Update failed:', error);
      toast.error('Failed: ' + (error?.error || error?.message || 'Unknown error'));
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      console.log('[MyProfile] Upload result:', result);

      // Extract URL from various possible response shapes
      const fileUrl = result?.file_url || result?.url || result?.secure_url;
      
      if (!fileUrl) {
        console.error('[MyProfile] No URL in upload response:', result);
        toast.error('Upload returned no URL');
        return;
      }

      console.log('[MyProfile] Got file URL:', fileUrl);

      // 🚀 KEY FIX: Auto-save the photo immediately, don't wait for "Save"
      // This way user sees the photo instantly + it's persisted
      const updatedUser = await base44.auth.updateMe({
        profile_photo: fileUrl,
      });
      
      console.log('[MyProfile] Auto-save result:', updatedUser);
      
      // Update local state with the saved data
      setUser(updatedUser);
      setFormData({
        ...formData,
        profile_photo: fileUrl,
      });
      
      toast.success('Photo updated!');
    } catch (error) {
      console.error('[MyProfile] Upload error:', error);
      toast.error('Failed to upload: ' + (error?.error || error?.message || 'Unknown error'));
    } finally {
      setUploading(false);
      // Reset file input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.mobile_number && formData.mobile_number.length < 10) {
      toast.error('Mobile number too short');
      return;
    }

    // Don't include profile_photo in this update — it's already saved on upload
    updateProfileMutation.mutate({
      mobile_number: formData.mobile_number,
      employee_id: formData.employee_id,
      department: formData.department,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      mobile_number: user?.mobile_number || '',
      employee_id: user?.employee_id || '',
      department: user?.department || '',
      profile_photo: user?.profile_photo || '',
    });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your personal information</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="border-0 shadow-sm md:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block">
                <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-indigo-100">
                  {user.profile_photo ? (
                    <AvatarImage src={user.profile_photo} alt={user.full_name} />
                  ) : (
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-3xl font-semibold">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                {/* Quick photo upload directly from sidebar */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="photo-upload-sidebar"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('photo-upload-sidebar').click()}
                  disabled={uploading}
                  className="absolute bottom-4 right-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 shadow-lg disabled:opacity-50"
                  title="Change photo"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </button>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{user.full_name}</h2>
              <p className="text-gray-500 text-sm mb-3">{user.email}</p>
              <Badge className={user.role === 'admin' ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-600"}>
                {user.role === 'admin' ? (
                  <><Shield className="w-3 h-3 mr-1" /> Admin</>
                ) : (
                  <><User className="w-3 h-3 mr-1" /> Employee</>
                )}
              </Badge>

              <div className="mt-6 space-y-3 text-left">
                {user.department && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{user.department}</span>
                  </div>
                )}
                {user.employee_id && (
                  <div className="flex items-center gap-3 text-sm">
                    <IdCard className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{user.employee_id}</span>
                  </div>
                )}
                {user.mobile_number && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{user.mobile_number}</span>
                  </div>
                )}
              </div>

              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700"
                >
                  Edit Profile
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card className="border-0 shadow-sm md:col-span-2">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={user.full_name} disabled className="bg-gray-50" />
                    <p className="text-xs text-gray-500">Contact admin to change your name</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={user.email} disabled className="bg-gray-50" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mobile Number</Label>
                      <Input
                        type="tel"
                        value={formData.mobile_number}
                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                        placeholder="10+ digit number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Employee ID</Label>
                      <Input
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        placeholder="e.g. EMP001"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    💡 <strong>Tip:</strong> Click the upload icon on your profile photo to change it. Photo saves automatically.
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={updateProfileMutation.isPending}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div>
                    <Label className="text-gray-500">Full Name</Label>
                    <p className="text-gray-900 font-medium mt-1">{user.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Email Address</Label>
                    <p className="text-gray-900 font-medium mt-1">{user.email}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-gray-500">Mobile Number</Label>
                      <p className="text-gray-900 font-medium mt-1">{user.mobile_number || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Employee ID</Label>
                      <p className="text-gray-900 font-medium mt-1">{user.employee_id || 'Not set'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Department</Label>
                    <p className="text-gray-900 font-medium mt-1">{user.department || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Role</Label>
                    <p className="text-gray-900 font-medium mt-1 capitalize">{user.role}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}