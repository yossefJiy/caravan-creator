import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, FileText, ListChecks, Palette, Copy, Check, Save, Image, History, Trash2, RefreshCw } from 'lucide-react';

type ContentType = 'text' | 'features' | 'description' | 'ux' | 'image';

interface GeneratedContent {
  content: string;
  model: string;
  contentType: ContentType;
}

interface GeneratedImage {
  image: string;
  text?: string;
  model: string;
}

interface ContentTarget {
  type: 'site_content' | 'truck_type' | 'truck_size' | 'equipment' | 'size_features';
  id?: string;
  field?: string;
}

interface HistoryItem {
  id: string;
  content_type: string;
  prompt: string;
  generated_content: string;
  model_used: string;
  target_type: string | null;
  is_saved: boolean;
  created_at: string;
}

const AIContentGenerator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ContentType>('text');
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [copied, setCopied] = useState(false);
  const [targetType, setTargetType] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch content history
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['ai-content-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_content_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as HistoryItem[];
    },
  });

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
        body: { 
          prompt, 
          contentType, 
          targetType,
          saveToHistory: true,
          userId: user?.id
        },
      });
      if (error) throw error;
      return data as GeneratedContent;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      refetchHistory();
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

  const generateImageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt,
          saveToHistory: true,
          userId: user?.id
        },
      });
      if (error) throw error;
      return data as GeneratedImage;
    },
    onSuccess: (data) => {
      setGeneratedImage(data);
      refetchHistory();
      toast({
        title: 'תמונה נוצרה בהצלחה',
        description: `נוצרה באמצעות ${data.model}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאה ביצירת תמונה',
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

        case 'equipment':
          const { error: equipError } = await supabase
            .from('equipment')
            .update({ description: content, updated_at: new Date().toISOString() })
            .eq('id', target.id);
          if (equipError) throw equipError;
          break;

        case 'size_features':
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

  const deleteHistoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_content_history')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchHistory();
      toast({
        title: 'נמחק בהצלחה',
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
    
    if (activeTab === 'image') {
      generateImageMutation.mutate(prompt);
    } else {
      generateMutation.mutate({ prompt, contentType: activeTab });
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      target: { type: targetType as ContentTarget['type'], id: targetId },
    });
  };

  const handleUseFromHistory = (item: HistoryItem) => {
    if (item.content_type === 'image') {
      setGeneratedImage({ image: item.generated_content, model: item.model_used || '' });
      setActiveTab('image');
    } else {
      setGeneratedContent({ 
        content: item.generated_content, 
        model: item.model_used || '', 
        contentType: item.content_type as ContentType 
      });
      setActiveTab(item.content_type as ContentType);
    }
    setPrompt(item.prompt);
    setShowHistory(false);
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
      case 'image':
        return 'תאר את התמונה שתרצה ליצור, לדוגמה: "פודטראק מודרני בצבע לבן עם עיצוב מינימליסטי, על רקע שקיעה"';
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
        return [{ value: 'size_features', label: 'תכונות גודל טראק' }];
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

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'טקסט';
      case 'features': return 'תכונות';
      case 'description': return 'תיאור';
      case 'ux': return 'UX';
      case 'image': return 'תמונה';
      default: return type;
    }
  };

  const isPending = generateMutation.isPending || generateImageMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">יצירת תוכן AI</h1>
          <p className="text-muted-foreground">צור תוכן ותמונות באמצעות בינה מלאכותית</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showHistory ? "default" : "outline"}
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            היסטוריה
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI
          </Badge>
        </div>
      </div>

      {showHistory ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                היסטוריית תוכן שנוצר
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => refetchHistory()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              צפה בתוכן שנוצר בעבר והשתמש בו שוב
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : history && history.length > 0 ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {history.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getContentTypeLabel(item.content_type)}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleString('he-IL')}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{item.prompt.substring(0, 100)}...</p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUseFromHistory(item)}
                          >
                            השתמש
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopy(item.generated_content)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteHistoryMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {item.content_type === 'image' ? (
                        <img 
                          src={item.generated_content} 
                          alt="Generated" 
                          className="max-w-[200px] rounded-lg"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.generated_content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                אין עדיין היסטוריית תוכן
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as ContentType);
          setGeneratedContent(null);
          setGeneratedImage(null);
        }}>
          <TabsList className="grid w-full grid-cols-5">
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
              UX
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2">
              <Image className="h-4 w-4" />
              תמונות
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
                  {activeTab === 'image' && 'מודל: Gemini Flash Image - ליצירת תמונות'}
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
                  disabled={isPending || !prompt.trim()}
                  className="w-full"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      יוצר...
                    </>
                  ) : (
                    <>
                      {activeTab === 'image' ? <Image className="h-4 w-4 ml-2" /> : <Sparkles className="h-4 w-4 ml-2" />}
                      {activeTab === 'image' ? 'צור תמונה' : 'צור תוכן'}
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
                  {(generatedContent || generatedImage) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopy(generatedContent?.content || generatedImage?.image || '')}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </CardTitle>
                {generatedContent && (
                  <CardDescription>נוצר באמצעות {generatedContent.model}</CardDescription>
                )}
                {generatedImage && (
                  <CardDescription>נוצר באמצעות {generatedImage.model}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTab === 'image' ? (
                  generatedImage ? (
                    <div className="space-y-4">
                      <img 
                        src={generatedImage.image} 
                        alt="Generated" 
                        className="w-full rounded-lg border"
                      />
                      {generatedImage.text && (
                        <p className="text-sm text-muted-foreground">{generatedImage.text}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-h-[200px] text-muted-foreground border-2 border-dashed rounded-lg">
                      <div className="text-center">
                        <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>התמונה שתיווצר תופיע כאן</p>
                      </div>
                    </div>
                  )
                ) : generatedContent ? (
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
      )}
    </div>
  );
};

export default AIContentGenerator;
