import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SiteContent {
  id: string;
  content_key: string;
  content_value: string;
  content_type: string;
  description: string | null;
  updated_at: string;
}

const ContentManagement = () => {
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contents, isLoading } = useQuery({
    queryKey: ['admin-site-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('content_key');
      if (error) throw error;
      return data as SiteContent[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (content: Partial<SiteContent> & { id?: string }) => {
      if (content.id) {
        const { error } = await supabase
          .from('site_content')
          .update({ 
            content_value: content.content_value, 
            content_type: content.content_type,
            description: content.description 
          })
          .eq('id', content.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_content')
          .insert({ 
            content_key: content.content_key!, 
            content_value: content.content_value!, 
            content_type: content.content_type!,
            description: content.description 
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-content'] });
      setIsDialogOpen(false);
      setEditingContent(null);
      toast({ title: 'נשמר בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('site_content').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-content'] });
      toast({ title: 'נמחק בהצלחה' });
    },
  });

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'טקסט';
      case 'title': return 'כותרת';
      case 'html': return 'HTML';
      case 'url': return 'קישור';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ניהול תוכן האתר</h1>
          <p className="text-muted-foreground">ערוך טקסטים, כותרות וקישורים באתר</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingContent(null)}>
              <Plus className="h-4 w-4 ml-2" />
              תוכן חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingContent ? 'עריכת תוכן' : 'תוכן חדש'}</DialogTitle>
            </DialogHeader>
            <ContentForm
              content={editingContent}
              onSave={(data) => saveMutation.mutate(data)}
              isLoading={saveMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {contents?.map((content) => (
          <Card key={content.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm bg-muted px-2 py-0.5 rounded">{content.content_key}</code>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                      {getContentTypeLabel(content.content_type)}
                    </span>
                  </div>
                  {content.description && (
                    <p className="text-sm text-muted-foreground mb-2">{content.description}</p>
                  )}
                  <p className="text-sm line-clamp-2">{content.content_value}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingContent(content);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('האם למחוק את התוכן הזה?')) {
                        deleteMutation.mutate(content.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {contents?.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              <p className="mb-2">אין תוכן עדיין.</p>
              <p className="text-sm">הוסף תוכן כדי לערוך טקסטים באתר בצורה דינמית.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Content Form Component
const ContentForm = ({ 
  content, 
  onSave, 
  isLoading 
}: { 
  content: SiteContent | null; 
  onSave: (data: Partial<SiteContent>) => void;
  isLoading: boolean;
}) => {
  const [contentKey, setContentKey] = useState(content?.content_key || '');
  const [contentValue, setContentValue] = useState(content?.content_value || '');
  const [contentType, setContentType] = useState(content?.content_type || 'text');
  const [description, setDescription] = useState(content?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: content?.id,
      content_key: contentKey,
      content_value: contentValue,
      content_type: contentType,
      description: description || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>מפתח (Key)</Label>
        <Input 
          value={contentKey} 
          onChange={(e) => setContentKey(e.target.value)} 
          required 
          disabled={!!content}
          placeholder="hero_title"
          className="font-mono"
        />
        {!content && (
          <p className="text-xs text-muted-foreground">מזהה ייחודי לתוכן (לא ניתן לשנות לאחר יצירה)</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>סוג תוכן</Label>
        <Select value={contentType} onValueChange={setContentType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">טקסט</SelectItem>
            <SelectItem value="title">כותרת</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="url">קישור</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>תיאור</Label>
        <Input 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="תיאור לעזרה בזיהוי התוכן"
        />
      </div>
      <div className="space-y-2">
        <Label>תוכן</Label>
        {contentType === 'html' ? (
          <Textarea 
            value={contentValue} 
            onChange={(e) => setContentValue(e.target.value)} 
            required 
            rows={6}
            className="font-mono text-sm"
          />
        ) : (
          <Textarea 
            value={contentValue} 
            onChange={(e) => setContentValue(e.target.value)} 
            required 
            rows={3}
          />
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור'}
      </Button>
    </form>
  );
};

export default ContentManagement;
