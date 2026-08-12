import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, Loader2, Image as ImageIcon, X, Bold, Italic, Code, BarChart2, Plus, Trash2, Globe, Users, Shield, Award, Calendar, HelpCircle, Smile, MapPin, Clock, AlertCircle, AlertTriangle, Briefcase, Search } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const generateId = () => Math.random().toString(36).substring(2, 9);

const EMOJI_LIST = ["😀","😂","🤣","😊","😍","🥰","😎","🤩","🤔","🙄","😴","😷","🤯","🥳","❤️","👍","🎉","🔥","✨","💯","🙌","👏","🚀","💡","🎯","🏆","📚","🎓"];

interface SortableImageItemProps {
  id: string;
  file: File;
  previewUrl: string;
  onRemove: (id: string) => void;
}

const SortableImageItem = ({ id, previewUrl, onRemove }: SortableImageItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative w-24 h-24 rounded-md overflow-hidden border group cursor-grab active:cursor-grabbing">
      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover pointer-events-none" />
      <div {...attributes} {...listeners} className="absolute inset-0 z-10" />
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(id); }} 
        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

interface RichComposerProps {
  onSubmit: (
    content: string, 
    tags: string[], 
    files: File[], 
    poll?: any, 
    options?: { privacy: string, clubId?: string, template: string, templateData?: any, provider_reference?: string | null, category?: string, isAnonymous?: boolean },
    onProgress?: (progress: number) => void
  ) => Promise<boolean | void>;
  user: any;
}

const PRESET_TAGS = ["General", "Scholarships", "Advice", "Networking", "Events", "Q&A", "Success Story"];

export const RichComposer = ({ onSubmit, user }: RichComposerProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [images, setImages] = useState<{ id: string; file: File; previewUrl: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionSearch, setMentionSearch] = useState<{ active: boolean; query: string; position: number }>({ active: false, query: "", position: 0 });
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const [privacy, setPrivacy] = useState<string>("public");
  const [clubId, setClubId] = useState<string>("");
  const [template, setTemplate] = useState<string>("standard");
  const [templateData, setTemplateData] = useState<any>({});
  
  const [category, setCategory] = useState<string>("discussion");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  
  const [providerReference, setProviderReference] = useState<{ id: string, name: string } | null>(null);
  const [providerSearch, setProviderSearch] = useState("");
  const [providerResults, setProviderResults] = useState<any[]>([]);
  const [isProviderSearchOpen, setIsProviderSearchOpen] = useState(false);
  
  const [draftRestored, setDraftRestored] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [savedDraft, setSavedDraft] = useState<any>(null);
  const [spamWarning, setSpamWarning] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [forcePost, setForcePost] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const t = searchParams.get("template");
    const p = searchParams.get("prefill");
    if (t) setTemplate(t);
    if (p) {
      setContent(p);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
    
    if (t || p) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("template");
      newParams.delete("prefill");
      setSearchParams(newParams);
    }
  }, [searchParams, setSearchParams]);

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const tagsToAdd = val.split(',').map(t => t.trim()).filter(t => t);
      const currentTags = [...selectedTags];
      tagsToAdd.forEach(t => {
        if (!currentTags.includes(t) && currentTags.length < 5) currentTags.push(t);
      });
      setSelectedTags(currentTags);
      setTagInput("");
      setTagSuggestions([]);
      return;
    }
    setTagInput(val);
    if (val.trim()) {
      const suggestions = PRESET_TAGS.filter(t => t.toLowerCase().includes(val.toLowerCase()) && !selectedTags.includes(t));
      setTagSuggestions(suggestions);
    } else {
      setTagSuggestions([]);
    }
  };

  useEffect(() => {
    if (!isProviderSearchOpen || !providerSearch.trim()) {
      setProviderResults([]);
      return;
    }
    const fetchProviders = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/repair/providers?search=${providerSearch}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setProviderResults(data.data || []);
        }
      } catch (err) {}
    };
    const timer = setTimeout(fetchProviders, 300);
    return () => clearTimeout(timer);
  }, [providerSearch, isProviderSearchOpen]);

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag) && selectedTags.length < 5) setSelectedTags([...selectedTags, tag]);
    setTagInput("");
    setTagSuggestions([]);
  };

  const removeTag = (tag: string) => setSelectedTags(selectedTags.filter(t => t !== tag));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const spaceLeft = 4 - images.length;
      const filesToAdd = filesArray.slice(0, spaceLeft).filter(f => f.size <= 5 * 1024 * 1024);
      const newImages = filesToAdd.map(f => ({ id: generateId(), file: f, previewUrl: URL.createObjectURL(f) }));
      setImages(prev => [...prev, ...newImages]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    if (!mentionSearch.active || mentionSearch.query.length === 0) {
      setMentionSuggestions([]);
      return;
    }
    const fetchMentions = async () => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      try {
        const res = await fetch(`${API_URL}/api/users/search?q=${mentionSearch.query}`);
        if (res.ok) setMentionSuggestions(await res.json());
      } catch (err) { }
    };
    const timer = setTimeout(fetchMentions, 300);
    return () => clearTimeout(timer);
  }, [mentionSearch]);

  const insertMention = (username: string) => {
    if (!textareaRef.current) return;
    const beforeMention = content.substring(0, mentionSearch.position);
    const afterMention = content.substring(textareaRef.current.selectionStart);
    const newContent = `${beforeMention}@${username} ${afterMention}`;
    setContent(newContent);
    setMentionSearch({ active: false, query: "", position: 0 });
    setMentionSuggestions([]);
    textareaRef.current.focus();
  };

  useEffect(() => {
    const draftStr = localStorage.getItem('composer_draft');
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (draft.content || (draft.selectedTags && draft.selectedTags.length > 0)) {
          setSavedDraft(draft);
          setShowDraftPrompt(true);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (!draftRestored && showDraftPrompt) return; // Don't overwrite if prompt is showing
    const timer = setTimeout(() => {
      if (content || selectedTags.length > 0) {
        localStorage.setItem('composer_draft', JSON.stringify({
          content, selectedTags, showPoll, pollOptions, privacy, clubId, template, templateData, providerReference
        }));
      } else {
        localStorage.removeItem('composer_draft');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [content, selectedTags, showPoll, pollOptions, privacy, clubId, template, templateData, draftRestored, showDraftPrompt]);

  const restoreDraft = () => {
    if (savedDraft) {
      setContent(savedDraft.content || "");
      setSelectedTags(savedDraft.selectedTags || []);
      setShowPoll(savedDraft.showPoll || false);
      setPollOptions(savedDraft.pollOptions || ["", ""]);
      setPrivacy(savedDraft.privacy || "public");
      setClubId(savedDraft.clubId || "");
      setTemplate(savedDraft.template || "standard");
      setTemplateData(savedDraft.templateData || {});
      setProviderReference(savedDraft.providerReference || null);
    }
    setShowDraftPrompt(false);
    setDraftRestored(true);
  };
  
  const discardDraft = () => {
    localStorage.removeItem('composer_draft');
    setShowDraftPrompt(false);
    setDraftRestored(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    
    const urlCount = (val.match(/https?:\/\/[^\s]+/g) || []).length;
    const hasRepeatingChars = /(.)\1{9,}/.test(val);
    if (urlCount > 2 || hasRepeatingChars) {
      setSpamWarning(true);
    } else {
      setSpamWarning(false);
      if (!duplicateWarning) setForcePost(false);
    }

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (match) setMentionSearch({ active: true, query: match[1], position: match.index! });
    else setMentionSearch({ active: false, query: "", position: 0 });
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (el.selectionStart !== el.selectionEnd) setSelectionRange({ start: el.selectionStart, end: el.selectionEnd });
    else setSelectionRange(null);
  };

  const applyFormatting = (wrapper: string) => {
    if (!selectionRange || !textareaRef.current) return;
    const { start, end } = selectionRange;
    const before = content.substring(0, start);
    const selected = content.substring(start, end);
    const after = content.substring(end);
    if (wrapper === '`' && selected.includes('\n')) wrapper = '```\n';
    const newSelected = wrapper + selected + (wrapper.trim() === '```' ? '\n```' : wrapper);
    setContent(before + newSelected + after);
    setSelectionRange(null);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + wrapper.length, end + wrapper.length);
      }
    }, 0);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    const lastPost = localStorage.getItem('last_post_content');
    if (lastPost === content.trim() && !forcePost) {
      setDuplicateWarning(true);
      return;
    }
    
    if (spamWarning && !forcePost) {
      setForcePost(true);
      return;
    }
    
    setPosting(true);
    setUploadProgress(0);

    const success = await onSubmit(
      content, 
      selectedTags, 
      images.map(i => i.file), 
      showPoll && pollOptions.filter(o => o.trim()).length >= 2 ? { options: pollOptions.filter(o => o.trim()).map(text => ({ text })) } : undefined,
      { privacy, clubId: clubId || undefined, template, templateData, provider_reference: providerReference?.id || null, category, isAnonymous },
      (progress) => setUploadProgress(progress)
    );
    
    if (success === false) {
      setPosting(false);
      setUploadProgress(0);
      return; // Error toast is handled by Community.tsx, keep draft
    }
    
    localStorage.setItem('last_post_content', content.trim());
    localStorage.removeItem('composer_draft');
    
    setPosting(false);
    setContent("");
    setImages([]);
    setSelectedTags([]);
    setShowPoll(false);
    setPollOptions(["", ""]);
    setTemplate("standard");
    setTemplateData({});
    setCategory("discussion");
    setIsAnonymous(false);
    setProviderReference(null);
    setSpamWarning(false);
    setDuplicateWarning(false);
    setForcePost(false);
    setUploadProgress(0);
  };

  const getPrivacyIcon = () => {
    if (privacy === 'followers') return <Users className="h-4 w-4 mr-1" />;
    if (privacy === 'club') return <Shield className="h-4 w-4 mr-1" />;
    return <Globe className="h-4 w-4 mr-1" />;
  };

  const getTemplateIcon = () => {
    if (template === 'achievement') return <Award className="h-4 w-4 mr-1" />;
    if (template === 'event') return <Calendar className="h-4 w-4 mr-1" />;
    if (template === 'question') return <HelpCircle className="h-4 w-4 mr-1" />;
    return null;
  };

  return (
    <Card className="mb-8 overflow-visible relative z-10 border-primary/20 shadow-sm">
      <CardContent className="p-4 space-y-3 relative">
        {showDraftPrompt && (
          <div className="bg-secondary p-3 rounded-md flex justify-between items-center text-sm border shadow-sm">
            <span>You have an unsaved draft from a previous session.</span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={discardDraft} className="h-7 text-xs">Discard</Button>
              <Button type="button" variant="default" size="sm" onClick={restoreDraft} className="h-7 text-xs">Restore Draft</Button>
            </div>
          </div>
        )}
        {duplicateWarning && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex justify-between items-center text-sm border border-destructive/20 shadow-sm">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> You just posted this exact same content!</span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDuplicateWarning(false)} className="h-7 text-xs">Edit</Button>
              <Button type="button" variant="default" size="sm" onClick={() => { setForcePost(true); handleSubmit(); }} className="h-7 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">Post Anyway</Button>
            </div>
          </div>
        )}
        {spamWarning && (
          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-md flex justify-between items-center text-sm border border-amber-500/20 shadow-sm">
            <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> This post may trigger our moderation filters.</span>
            {!forcePost ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setForcePost(true)} className="h-7 text-xs border-amber-500/30">Review & Post</Button>
            ) : (
              <span className="text-xs opacity-70">Will be posted under review</span>
            )}
          </div>
        )}
        <div className="relative">
          {selectionRange && (
            <div className="absolute -top-10 left-0 bg-popover border shadow-lg rounded-md flex items-center p-1 gap-1 z-50">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => applyFormatting('**')}><Bold className="h-3 w-3" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => applyFormatting('*')}><Italic className="h-3 w-3" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => applyFormatting('`')}><Code className="h-3 w-3" /></Button>
            </div>
          )}
          <textarea ref={textareaRef} className="w-full min-h-[80px] p-2 bg-transparent resize-none outline-none text-base placeholder:text-muted-foreground focus-visible:ring-0" placeholder="What's on your mind? Mention using @..." value={content} onChange={handleTextChange} onSelect={handleSelect} onBlur={() => setTimeout(() => setSelectionRange(null), 200)} maxLength={2000} />
          {mentionSearch.active && mentionSuggestions.length > 0 && (
            <div className="absolute z-50 bg-popover border shadow-lg rounded-md mt-1 max-h-48 overflow-y-auto w-48" style={{ top: '100%', left: 0 }}>
              {mentionSuggestions.map(u => (
                <div key={u.id || u._id} className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer" onClick={() => insertMention(u.username)}>
                  <img src={u.avatar_url || 'https://github.com/shadcn.png'} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-sm font-medium">{u.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {images.length > 0 && (
          <div className="mt-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={images.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex flex-wrap gap-2">
                  {images.map(img => <SortableImageItem key={img.id} id={img.id} file={img.file} previewUrl={img.previewUrl} onRemove={removeImage} />)}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
        <div className="relative z-0">
          <Input className="border-none bg-secondary/30 h-8 text-sm" placeholder={selectedTags.length < 5 ? "Add tags... (press enter or comma)" : "Max 5 tags reached"} value={tagInput} onChange={handleTagInputChange} disabled={selectedTags.length >= 5} onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); addTag(tagInput.trim()); } }} />
          {tagSuggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-popover border shadow-md rounded-md mt-1 p-1 z-50 max-h-40 overflow-y-auto">
              {tagSuggestions.map(tag => <div key={tag} className="px-3 py-1.5 text-sm hover:bg-muted cursor-pointer rounded-sm" onClick={() => addTag(tag)}>{tag}</div>)}
            </div>
          )}
        </div>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedTags.map(tag => <Badge key={tag} variant="secondary" className="flex items-center gap-1 cursor-pointer" onClick={() => removeTag(tag)}>{tag} <X className="h-3 w-3" /></Badge>)}
          </div>
        )}
        {showPoll && (
          <div className="mt-2 p-3 bg-secondary/20 rounded-md border border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Create a Poll</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPoll(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input 
                    value={opt} 
                    onChange={(e) => {
                      const newOpts = [...pollOptions];
                      newOpts[idx] = e.target.value;
                      setPollOptions(newOpts);
                    }} 
                    placeholder={`Option ${idx + 1}`}
                    className="h-8 bg-background" 
                  />
                  {pollOptions.length > 2 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                      const newOpts = [...pollOptions];
                      newOpts.splice(idx, 1);
                      setPollOptions(newOpts);
                    }}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <Button variant="outline" size="sm" className="w-full h-8 mt-2 border-dashed" onClick={() => setPollOptions([...pollOptions, ""])}>
                  <Plus className="mr-2 h-4 w-4" /> Add Option
                </Button>
              )}
            </div>
          </div>
        )}
        
        {template === 'event' && (
          <div className="mt-2 p-3 bg-primary/5 rounded-md border border-primary/20 space-y-2">
            <span className="text-sm font-semibold flex items-center gap-1 text-primary"><Calendar className="h-4 w-4" /> Event Details</span>
            <div className="flex gap-2">
              <Input type="date" className="h-8 text-sm" value={templateData.event_date || ''} onChange={e => setTemplateData({...templateData, event_date: e.target.value})} />
              <Input type="time" className="h-8 text-sm" value={templateData.event_time || ''} onChange={e => setTemplateData({...templateData, event_time: e.target.value})} />
            </div>
            <Input className="h-8 text-sm" placeholder="Location (e.g., Auditorium, Zoom Link)" value={templateData.event_location || ''} onChange={e => setTemplateData({...templateData, event_location: e.target.value})} />
          </div>
        )}

        {providerReference && (
          <div className="mt-2 p-2 bg-blue-500/10 rounded-md border border-blue-500/20 flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-blue-500">
              <Briefcase className="h-4 w-4" />
              <span>Referencing provider: <strong>{providerReference.name}</strong></span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => setProviderReference(null)}><X className="h-4 w-4" /></Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 border-t gap-2 sm:gap-0">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            
            {/* Formatting / Media */}
            <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary" disabled={images.length >= 4} onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">{images.length}/4</span></Button>
            <Button type="button" variant="ghost" size="sm" className={`h-8 px-2 hidden sm:flex ${showPoll ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} onClick={() => setShowPoll(!showPoll)}><BarChart2 className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Poll</span></Button>
            
            {/* Emoji & GIF Picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary">
                  <Smile className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2 bg-background border shadow-lg z-50 rounded-lg">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Emojis</div>
                <div className="grid grid-cols-7 gap-1 max-h-32 overflow-y-auto mb-2">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setContent(prev => prev + emoji)} className="text-xl hover:bg-secondary rounded p-1 transition-colors">{emoji}</button>
                  ))}
                </div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 border-t pt-2">GIFs (Mock)</div>
                <div className="grid grid-cols-3 gap-1">
                  {[1,2,3].map(i => (
                    <button key={i} type="button" onClick={() => setContent(prev => prev + `\n![GIF](https://picsum.photos/seed/${i + Math.random()}/200)\n`)} className="bg-secondary rounded h-12 flex items-center justify-center text-[10px] text-muted-foreground hover:bg-secondary/80 font-medium">GIF {i}</button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
            
            {/* Provider Attach Popover */}
            <Popover open={isProviderSearchOpen} onOpenChange={setIsProviderSearchOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className={`h-8 px-2 ${providerReference ? 'text-blue-400 bg-blue-500/10' : 'text-muted-foreground hover:text-primary'}`}>
                  <Briefcase className="h-4 w-4" /> <span className="hidden sm:inline ml-1">Provider</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-3">
                <div className="text-sm font-semibold mb-2">Attach a Service Provider</div>
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search providers..." 
                    className="pl-8 h-8 text-sm" 
                    value={providerSearch} 
                    onChange={e => setProviderSearch(e.target.value)} 
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {providerResults.length > 0 ? providerResults.map(provider => (
                    <div 
                      key={provider._id || provider.id} 
                      className="p-2 hover:bg-secondary rounded cursor-pointer flex flex-col"
                      onClick={() => {
                        setProviderReference({ id: provider._id || provider.id, name: provider.name });
                        setIsProviderSearchOpen(false);
                      }}
                    >
                      <span className="font-medium text-sm text-foreground">{provider.name}</span>
                      <span className="text-xs text-muted-foreground">{provider.category}</span>
                    </div>
                  )) : providerSearch ? (
                    <div className="text-xs text-muted-foreground p-2 text-center">No providers found</div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-2 text-center">Search for a provider to attach</div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Template Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className={`h-8 px-2 ${template !== 'standard' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}>
                  {getTemplateIcon()} <span className="hidden sm:inline capitalize">{template === 'standard' ? 'Type' : template}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => { setTemplate('standard'); setTemplateData({}); }}>Standard Post</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTemplate('achievement')}><Award className="h-4 w-4 mr-2" /> Achievement</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTemplate('event')}><Calendar className="h-4 w-4 mr-2" /> Event</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTemplate('question')}><HelpCircle className="h-4 w-4 mr-2" /> Question</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Privacy Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary">
                  {getPrivacyIcon()} <span className="hidden sm:inline capitalize">{privacy}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => { setPrivacy('public'); setClubId(''); }}><Globe className="h-4 w-4 mr-2" /> Public</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setPrivacy('followers'); setClubId(''); }}><Users className="h-4 w-4 mr-2" /> Followers Only</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setPrivacy('club'); setClubId('default_club'); }}><Shield className="h-4 w-4 mr-2" /> My Club (Mock)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Category Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary">
                  <span className="hidden sm:inline capitalize">Category: {category}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCategory('discussion')}>Discussion</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategory('question')}>Question</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategory('experience')}>Experience</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategory('opportunity')}>Opportunity</DropdownMenuItem>
                {/* poll category is set automatically if poll options exist */}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Anonymous Toggle */}
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className={`h-8 px-2 ${isAnonymous ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}
              onClick={() => setIsAnonymous(!isAnonymous)}
            >
              <Shield className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Anonymous</span>
            </Button>
            
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className={`text-xs ${content.length > 1900 ? 'text-red-500' : 'text-muted-foreground'}`}>{content.length}/2000</span>
            <Button onClick={handleSubmit} disabled={posting || !content.trim()} className="rounded-full px-6 transition-all bg-black text-white hover:bg-black/90 disabled:bg-muted disabled:text-muted-foreground">
              {posting ? (
                uploadProgress > 0 ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {uploadProgress}%</span>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )
              ) : <><Send className="mr-2 h-4 w-4" />{t("Post")}</>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
