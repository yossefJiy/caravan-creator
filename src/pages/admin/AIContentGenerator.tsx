import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, FileText, ListChecks, Palette, Copy, Check, Save } from 'lucide-react';

type ContentType = 'text' | 'features' | 'description' | 'ux';

interface GeneratedContent {
  content: string;
  model: string;
  contentType: ContentType;
}

interface ContentTarget {
  type: 'site_content' | 'truck_type' | 'truck_size' | 'equipment' | 'size_features';
  id?: string;
  field?: string;
}

const AIContentGenerator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ContentType>('text');
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [targetType, setTargetType] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [targetField, setTargetField] = useState<string>('');

  // Fetch data for target selection
  const { data: truckTypes } = useQuery({
    queryKey: ['truck-types-ai'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('truck_types')
        .select('id, name, name_he')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: truckSizes } = useQuery({
    queryKey: ['truck-sizes-ai'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('truck_sizes')
        .select('id, name, truck_type_id')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: equipment } = useQuery({
    queryKey: ['equipment-ai'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: siteContent } = useQuery({
    queryKey: ['site-content-ai'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('id, content_key, description')
        .order('content_key');
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async ({ prompt, contentType }: { prompt: string; contentType: ContentType }) => {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { prompt, contentType, targetType },
      });
      if (error) throw error;
      return data as GeneratedContent;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({
        title: 'תוכן נוצר בהצלחה',
        description: `נוצר באמצעות ${data.model}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה ביצירת תוכן',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ content, target }: { content: string; target: ContentTarget }) => {
      if (!target.id) throw new Error('יש לבחור יעד לשמירה');

      switch (target.type) {
        case 'site_content':
          const { error: siteError } = await supabase
            .from('site_content')
            .update({ content_value: content, updated_at: new Date().toISOString() })
            .eq('id', target.id);
          if (siteError) throw siteError;
          break;

        case 'truck_type':
          // No description field currently, but could be added
          throw new Error('סוג הטראק אינו תומך בשמירת תיאור');

        case 'equipment':
          const { error: equipError } = await supabase
            .from('equipment')
            .update({ description: content, updated_at: new Date().toISOString() })
            .eq('id', target.id);
          if (equipError) throw equipError;
          break;

        case 'size_features':
          // For features, we need to parse and insert them
          const features = content.split('\n').filter(f => f.trim());
          const { data: existingFeatures } = await supabase
            .from('size_features')
            .select('sort_order')
            .eq('truck_size_id', target.id)
            .order('sort_order', { ascending: false })
            .limit(1);
          
          const startOrder = (existingFeatures?.[0]?.sort_order || 0) + 1;
          const featureInserts = features.map((feature, index) => ({
            truck_size_id: target.id,
            feature_text: feature.replace(/^[-•*]\s*/, '').trim(),
            sort_order: startOrder + index,
          }));
          
          const { error: featuresError } = await supabase
            .from('size_features')
            .insert(featureInserts);
          if (featuresError) throw featuresError;
          break;

        default:
          throw new Error('סוג יעד לא נתמך');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: 'נשמר בהצלחה',
        description: 'התוכן נשמר ליעד שנבחר',
      });
      setGeneratedContent(null);
      setPrompt('');
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה בשמירה',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: 'נא להזין פרומפט',
        variant: 'destructive',
      });
      return;
    }
    generateMutation.mutate({ prompt, contentType: activeTab });
  };

  const handleCopy = async () => {
    if (generatedContent?.content) {
      await navigator.clipboard.writeText(generatedContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    if (!generatedContent?.content || !targetType || !targetId) {
      toast({
        title: 'נא לבחור יעד לשמירה',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate({
      content: generatedContent.content,
      target: { type: targetType as ContentTarget['type'], id: targetId, field: targetField },
    });
  };

  const getPlaceholder = () => {
    switch (activeTab) {
      case 'text':
        return 'תאר את התוכן שתרצה ליצור, לדוגמה: "כתוב כותרת ראשית לאתר של פודטראקים יוקרתיים"';
      case 'features':
        return 'תאר את סוג התכונות, לדוגמה: "רשימת תכונות לפודטראק מטבח איטלקי בגודל גדול"';
      case 'description':
        return 'תאר את המוצר, לדוגמה: "תיאור קצר לגריל גז תעשייתי לפודטראק"';
      case 'ux':
        return 'תאר את הבעיה או השיפור הנדרש, לדוגמה: "איך לשפר את תהליך הבחירה בקונפיגורטור?"';
      default:
        return 'הזן את הבקשה שלך...';
    }
  };

  const getTargetOptions = () => {
    switch (activeTab) {
      case 'text':
      case 'description':
        return [
          { value: 'site_content', label: 'תוכן האתר' },
          { value: 'equipment', label: 'תיאור ציוד' },
        ];
      case 'features':
        return [
          { value: 'size_features', label: 'תכונות גודל טראק' },
        ];
      default:
        return [];
    }
  };

  const getTargetIdOptions = () => {
    switch (targetType) {
      case 'site_content':
        return siteContent?.map(c => ({ value: c.id, label: c.description || c.content_key })) || [];
      case 'equipment':
        return equipment?.map(e => ({ value: e.id, label: e.name })) || [];
      case 'size_features':
        return truckSizes?.map(s => {
          const type = truckTypes?.find(t => t.id === s.truck_type_id);
          return { value: s.id, label: `${type?.name_he || ''} - ${s.name}` };
        }) || [];
      default:
        return [];
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">יצירת תוכן AI</h1>
          <p className="text-muted-foreground">צור תוכן באמצעות בינה מלאכותית</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          OpenRouter AI
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="text" className="gap-2">
            <FileText className="h-4 w-4" />
            תוכן טקסט
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <ListChecks className="h-4 w-4" />
            תכונות
          </TabsTrigger>
          <TabsTrigger value="description" className="gap-2">
            <FileText className="h-4 w-4" />
            תיאורים
          </TabsTrigger>
          <TabsTrigger value="ux" className="gap-2">
            <Palette className="h-4 w-4" />
            UX/ארכיטקטורה
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>פרומפט</CardTitle>
              <CardDescription>
                {activeTab === 'text' && 'מודל: Mistral Nemo - מתאים לתוכן שיווקי בעברית'}
                {activeTab === 'features' && 'מודל: Mistral Nemo - ליצירת רשימות תכונות'}
                {activeTab === 'description' && 'מודל: Mistral Nemo - לתיאורי מוצרים'}
                {activeTab === 'ux' && 'מודל: Claude 3 Haiku - להמלצות UX וארכיטקטורה'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>מה תרצה ליצור?</Label>
                <Textarea
                  placeholder={getPlaceholder()}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !prompt.trim()}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    יוצר תוכן...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 ml-2" />
                    צור תוכן
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                תוצאה
                {generatedContent && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </CardTitle>
              {generatedContent && (
                <CardDescription>
                  נוצר באמצעות {generatedContent.model}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedContent ? (
                <>
                  <div className="p-4 bg-muted rounded-lg min-h-[150px] whitespace-pre-wrap">
                    {generatedContent.content}
                  </div>

                  {activeTab !== 'ux' && (
                    <div className="space-y-4 border-t pt-4">
                      <Label>שמור ליעד</Label>
                      <div className="grid gap-3">
                        <Select value={targetType} onValueChange={setTargetType}>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר סוג יעד" />
                          </SelectTrigger>
                          <SelectContent>
                            {getTargetOptions().map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {targetType && (
                          <Select value={targetId} onValueChange={setTargetId}>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר יעד ספציפי" />
                            </SelectTrigger>
                            <SelectContent>
                              {getTargetIdOptions().map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        <Button
                          onClick={handleSave}
                          disabled={saveMutation.isPending || !targetId}
                          variant="secondary"
                        >
                          {saveMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                              שומר...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 ml-2" />
                              שמור ליעד
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center min-h-[150px] text-muted-foreground">
                  התוכן שייווצר יופיע כאן
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};

export default AIContentGenerator;
