
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ProjectRole, ProjectShare } from '@/types/supabase';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2, UserPlus, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ShareProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export const ShareProjectModal = ({ 
  open, 
  onOpenChange, 
  projectId, 
  projectName 
}: ShareProjectModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('read_only');
  const [shares, setShares] = useState<ProjectShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  const fetchShares = async () => {
    if (!projectId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_shares')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) {
        console.error('Error fetching project shares:', error);
        toast.error(t('Error fetching shares'), {
          description: error.message
        });
        return;
      }
      
      console.log('Project shares fetched:', data?.length || 0);
      setShares(data as ProjectShare[]);
    } catch (error) {
      console.error('Exception fetching project shares:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && projectId) {
      fetchShares();
    }
  }, [open, projectId]);

  const handleInvite = async () => {
    if (!email || !role || !projectId || !user) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('Invalid email'), {
        description: t('Please enter a valid email address')
      });
      return;
    }
    
    // Don't allow sharing with yourself
    if (user.email?.toLowerCase() === email.toLowerCase()) {
      toast.error(t('Cannot invite yourself'), {
        description: t('You already have access to this project')
      });
      return;
    }
    
    setSendingInvite(true);
    try {
      // Check if user exists
      const { data: userProfiles, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .limit(1);
      
      if (userError) {
        throw userError;
      }
      
      let userId = null;
      if (userProfiles && userProfiles.length > 0) {
        userId = userProfiles[0].id;
      }
      
      // Check if share already exists
      if (userId) {
        const { data: existingShares, error: shareError } = await supabase
          .from('project_shares')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', userId);
        
        if (shareError) {
          throw shareError;
        }
        
        if (existingShares && existingShares.length > 0) {
          // Update existing share instead of creating a new one
          const { error: updateError } = await supabase
            .from('project_shares')
            .update({ 
              role,
              inviter_id: user.id,
              invited_email: email.toLowerCase(),
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingShares[0].id);
          
          if (updateError) {
            throw updateError;
          }
          
          // Send invitation email for the updated share
          await sendInvitationEmail(existingShares[0].id, email.toLowerCase(), role);
          
          toast.success(t('Invitation updated'), {
            description: t('Share permissions have been updated')
          });
          
          await fetchShares();
          setEmail('');
          return;
        }
      }
      
      // For users that don't exist yet or existing users without shares
      let newShareId;
      
      const insertData = {
        project_id: projectId,
        user_id: userId || null, // Use null instead of current user's ID as placeholder if no user exists
        role,
        inviter_id: user.id,
        invited_email: email.toLowerCase(),
        status: 'pending'
      };

      const { data: newShare, error: insertError } = await supabase
        .from('project_shares')
        .insert(insertData)
        .select('id')
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      newShareId = newShare?.id;
      
      // Send invitation email
      if (newShareId) {
        await sendInvitationEmail(newShareId, email.toLowerCase(), role);
      }
      
      toast.success(t('Invitation sent'), {
        description: t('An invitation has been sent to {{email}}', { email })
      });
      
      await fetchShares();
      setEmail('');
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(t('Failed to send invitation'), {
        description: error.message || t('An unknown error occurred')
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const sendInvitationEmail = async (invitationId: string, recipientEmail: string, role: string) => {
    try {
      const appUrl = window.location.origin;
      
      // Fetch the inviter's profile to get their email
      const { data: inviterProfile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        console.error('Error fetching inviter profile:', profileError);
      }

      const inviterEmail = inviterProfile?.email || user?.email || '';

      // Get the current access token
      const { data } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token || '';

      const response = await fetch(`${window.location.origin}/api/send-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          inviterEmail,
          recipientEmail,
          projectName,
          projectId,
          role,
          invitationId,
          appUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Error sending invitation email:', error);
      // Don't show error toast here as it's not critical to the sharing process
    }
  };

  const handleRevokeAccess = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('project_shares')
        .delete()
        .eq('id', shareId);
      
      if (error) {
        throw error;
      }
      
      toast.success(t('Access revoked'), {
        description: t('User access has been removed')
      });
      
      await fetchShares();
    } catch (error: any) {
      console.error('Error revoking access:', error);
      toast.error(t('Failed to revoke access'), {
        description: error.message || t('An unknown error occurred')
      });
    }
  };

  const handleUpdateRole = async (shareId: string, newRole: ProjectRole) => {
    try {
      const { error } = await supabase
        .from('project_shares')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', shareId);
      
      if (error) {
        throw error;
      }
      
      toast.success(t('Role updated'), {
        description: t('User permissions have been updated')
      });
      
      await fetchShares();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(t('Failed to update role'), {
        description: error.message || t('An unknown error occurred')
      });
    }
  };

  const getRoleLabel = (role: ProjectRole) => {
    switch(role) {
      case 'contributor': return t('Contributor');
      case 'knowledge_manager': return t('Knowledge Manager');
      case 'read_only': return t('Read Only');
      case 'owner': return t('Owner');
      default: return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('Share Project: {{projectName}}', { projectName })}
          </DialogTitle>
          <DialogDescription>
            {t('Invite others to collaborate on this project')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <Label>{t('Invite someone new')}</Label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('Email address')}
                  type="email"
                />
              </div>
              <div className="w-full md:w-[180px]">
                <Select 
                  value={role} 
                  onValueChange={(value) => setRole(value as ProjectRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select role')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contributor">{t('Contributor')}</SelectItem>
                    <SelectItem value="knowledge_manager">{t('Knowledge Manager')}</SelectItem>
                    <SelectItem value="read_only">{t('Read Only')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleInvite} 
                disabled={!email || sendingInvite}
                className="w-full md:w-auto"
              >
                {sendingInvite ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {t('Invite')}
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">{t('People with access')}</h3>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="ml-2">{t('Loading...')}</span>
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center p-4 bg-gray-50 rounded-md">
                <p className="text-gray-500">{t('No one has access yet')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Project Owner */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                        {user?.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{user?.email}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {t('Owner')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Shared Users */}
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-300 text-white flex items-center justify-center">
                          {(share.invited_email?.charAt(0) || '?').toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{share.invited_email}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Badge 
                            variant={share.status === 'accepted' ? "default" : "outline"} 
                            className="text-xs"
                          >
                            {share.status === 'accepted' ? t('Accepted') : t('Pending')}
                          </Badge>
                          
                          <Select
                            defaultValue={share.role}
                            onValueChange={(value) => handleUpdateRole(share.id, value as ProjectRole)}
                          >
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue placeholder={getRoleLabel(share.role)} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="contributor">{t('Contributor')}</SelectItem>
                              <SelectItem value="knowledge_manager">{t('Knowledge Manager')}</SelectItem>
                              <SelectItem value="read_only">{t('Read Only')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRevokeAccess(share.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
