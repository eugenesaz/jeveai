
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { ProjectShare } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';

interface PendingInvitationTileProps {
  invitation: ProjectShare & { 
    project: any;
    inviterEmail?: string;
  };
  onAcceptReject: () => void;
}

export const PendingInvitationTile = ({ invitation, onAcceptReject }: PendingInvitationTileProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'contributor': return t('Contributor');
      case 'knowledge_manager': return t('Knowledge Manager');
      case 'read_only': return t('Read Only');
      case 'owner': return t('Owner');
      default: return role;
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user) {
      toast.error(t('Authentication required'), {
        description: t('You must be logged in to accept invitations')
      });
      return;
    }

    setLoading('accept');
    try {
      // Update the invitation status and set user_id if not already set
      const updateData = { 
        status: 'accepted',
        user_id: user.id,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('project_shares')
        .update(updateData)
        .eq('id', invitation.id);

      if (error) {
        throw error;
      }

      toast.success(t('Invitation Accepted'), {
        description: t('You now have access to this project')
      });
      
      // Trigger refresh of parent component
      onAcceptReject();
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(t('Failed to accept invitation'), {
        description: error.message || t('An unknown error occurred')
      });
    } finally {
      setLoading(null);
    }
  };

  const handleRejectInvitation = async () => {
    setLoading('reject');
    try {
      // Update the invitation status
      const { error } = await supabase
        .from('project_shares')
        .update({ 
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (error) {
        throw error;
      }

      toast.success(t('Invitation Declined'), {
        description: t('The invitation has been declined')
      });
      
      // Trigger refresh of parent component
      onAcceptReject();
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      toast.error(t('Failed to decline invitation'), {
        description: error.message || t('An unknown error occurred')
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-blue-50 hover:shadow-lg transition-shadow relative">
      <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 text-xs rounded-bl-md">
        {t('Invitation')}
      </div>
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {invitation.project?.name || t('Untitled Project')}
        </CardTitle>
        <CardDescription>
          <div className="text-sm">
            {invitation.inviterEmail && (
              <div className="mt-1 text-blue-600">
                {t('Invited by')}: {invitation.inviterEmail}
              </div>
            )}
            <div className="mt-1 flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {getRoleLabel(invitation.role)}
              </Badge>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {invitation.project?.landing_image && invitation.project.landing_image.trim() !== '' ? (
          <div className="w-full h-40 mb-4 overflow-hidden rounded">
            <img 
              src={invitation.project.landing_image} 
              alt={invitation.project.name}
              className="w-full h-full object-cover opacity-60"
            />
          </div>
        ) : (
          <div className="w-full h-40 mb-4 overflow-hidden rounded bg-blue-100 flex items-center justify-center">
            <p className="text-gray-500">{t('Preview not available until accepted')}</p>
          </div>
        )}
        <p className="text-sm text-blue-600 font-medium">
          {t('You have been invited to join this project')}
        </p>
      </CardContent>
      
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <Button 
          variant="outline"
          onClick={handleRejectInvitation}
          disabled={loading !== null}
          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          {loading === 'reject' ? (
            <span className="animate-spin mr-2">●</span>
          ) : (
            <X className="h-4 w-4 mr-2" />
          )}
          {t('Decline')}
        </Button>
        <Button 
          onClick={handleAcceptInvitation}
          disabled={loading !== null}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading === 'accept' ? (
            <span className="animate-spin mr-2">●</span>
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          {t('Accept')}
        </Button>
      </CardFooter>
    </Card>
  );
};
