import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Mail, Type, Layout, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SiteContent {
  id: string;
  content_key: string;
  content_value: string;
  content_type: string;
  category: string;
  description: string | null;
  updated_at: string;
}

interface EmailConfig {
  id: string;
  config_key: string;
  config_value: string;
  description: string | null;
  updated_at: string;
}

// Category definitions with icons and labels
const CATEGORIES = {
  emails: { label: 'הגדרות מיילים', icon: Mail, description: 'כתובות מייל רגישות (מוגנות)' },
  welcome: { label: 'מסך פתיחה', icon: Layout, description: 'תוכן מסך הפתיחה והברכה' },
  configurator: { label: 'קונפיגורטור', icon: Settings, description: 'כותרות וטקסטים בשלבי הבחירה' },
  general: { label: 'כללי', icon: Type, description: 'תוכן כללי נוסף' },
};

const ContentManagement = () => {
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [editingEmailConfig, setEditingEmailConfig] = useState<EmailConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('emails');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch site_content
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

  // Fetch email_config (protected table)
  const { data: emailConfigs, isLoading: isLoadingEmails } = useQuery({
    queryKey: ['admin-email-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_config')
        .select('*')
        .order('config_key');
      if (error) throw error;
      return data as EmailConfig[];
    },
  });

  // Group contents by category
  const contentsByCategory = useMemo(() => {
    const grouped: Record<string, SiteContent[]> = {};
    Object.keys(CATEGORIES).forEach(cat => grouped[cat] = []);
    
    contents?.forEach(content => {
      const cat = content.category || 'general';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(content);
    });
    
    return grouped;
  }, [contents]);

  const saveMutation = useMutation({
    mutationFn: async (content: Partial<SiteContent> & { id?: string }) => {
      if (content.id) {
        const { error } = await supabase
          .from('site_content')
          .update({ 
            content_value: content.content_value, 
            content_type: content.content_type,
            category: content.category,
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
            category: content.category || 'general',
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

  // Email config mutations
  const saveEmailMutation = useMutation({
    mutationFn: async (config: Partial<EmailConfig> & { id?: string }) => {
      if (config.id) {
        const { error } = await supabase
          .from('email_config')
          .update({ 
            config_value: config.config_value,
            description: config.description 
          })
          .eq('id', config.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-config'] });
      setIsEmailDialogOpen(false);
      setEditingEmailConfig(null);
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
      case 'email': return 'מייל';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ניהול תוכן האתר</h1>
          <p className="text-muted-foreground">ערוך טקסטים, כותרות והגדרות מיילים</p>
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
              defaultCategory={activeCategory}
              onSave={(data) => saveMutation.mutate(data)}
              isLoading={saveMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
          {Object.entries(CATEGORIES).map(([key, { label, icon: Icon }]) => (
            <TabsTrigger 
              key={key} 
              value={key}
              className="flex items-center gap-2 data-[state=active]:bg-background"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {key === 'emails' ? (
                emailConfigs && emailConfigs.length > 0 && (
                  <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                    {emailConfigs.length}
                  </span>
                )
              ) : (
                contentsByCategory[key]?.length > 0 && (
                  <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                    {contentsByCategory[key].length}
                  </span>
                )
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Special tab for emails - uses email_config table */}
        <TabsContent value="emails" className="mt-4">
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              כתובות מייל רגישות (מוגנות) - משמשות לשליחת התראות
            </p>
          </div>
          
          <div className="space-y-3">
            {isLoadingEmails ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              emailConfigs?.map((config) => (
                <Card key={config.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm bg-muted px-2 py-0.5 rounded">{config.config_key}</code>
                          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                            מייל
                          </span>
                        </div>
                        {config.description && (
                          <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                        )}
                        <p className="text-sm line-clamp-2 font-medium">{config.config_value}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setEditingEmailConfig(config);
                            setIsEmailDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Other categories - use site_content table */}
        {Object.entries(CATEGORIES).filter(([key]) => key !== 'emails').map(([key, { description }]) => (
          <TabsContent key={key} value={key} className="mt-4">
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            
            <div className="space-y-3">
              {contentsByCategory[key]?.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  onEdit={() => {
                    setEditingContent(content);
                    setIsDialogOpen(true);
                  }}
                  onDelete={() => {
                    if (confirm('האם למחוק את התוכן הזה?')) {
                      deleteMutation.mutate(content.id);
                    }
                  }}
                  getContentTypeLabel={getContentTypeLabel}
                />
              ))}
              
              {contentsByCategory[key]?.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">אין תוכן בקטגוריה זו.</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingContent(null);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף תוכן
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Email config edit dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>עריכת הגדרת מייל</DialogTitle>
          </DialogHeader>
          {editingEmailConfig && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>מפתח</Label>
                <Input value={editingEmailConfig.config_key} disabled className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>ערך</Label>
                <Textarea 
                  value={editingEmailConfig.config_value}
                  onChange={(e) => setEditingEmailConfig({
                    ...editingEmailConfig,
                    config_value: e.target.value
                  })}
                  rows={3}
                />
              </div>
              <Button 
                onClick={() => saveEmailMutation.mutate(editingEmailConfig)}
                disabled={saveEmailMutation.isPending}
                className="w-full"
              >
                {saveEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Content Card Component
const ContentCard = ({ 
  content, 
  onEdit, 
  onDelete, 
  getContentTypeLabel 
}: { 
  content: SiteContent; 
  onEdit: () => void; 
  onDelete: () => void;
  getContentTypeLabel: (type: string) => string;
}) => (
  <Card>
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
          <p className="text-sm line-clamp-2 font-medium">{content.content_value}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Content Form Component
const ContentForm = ({ 
  content, 
  defaultCategory,
  onSave, 
  isLoading 
}: { 
  content: SiteContent | null; 
  defaultCategory: string;
  onSave: (data: Partial<SiteContent>) => void;
  isLoading: boolean;
}) => {
  const [contentKey, setContentKey] = useState(content?.content_key || '');
  const [contentValue, setContentValue] = useState(content?.content_value || '');
  const [contentType, setContentType] = useState(content?.content_type || 'text');
  const [category, setCategory] = useState(content?.category || defaultCategory);
  const [description, setDescription] = useState(content?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: content?.id,
      content_key: contentKey,
      content_value: contentValue,
      content_type: contentType,
      category,
      description: description || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
        </div>
        <div className="space-y-2">
          <Label>קטגוריה</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORIES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            <SelectItem value="email">מייל</SelectItem>
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
