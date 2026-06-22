import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Share2, Bookmark, ExternalLink, Calendar, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function FestivalBottomSheet({ open, onOpenChange, festival }) {
  const [wikiData, setWikiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (open && festival) {
      // Check if saved
      try {
        const saved = JSON.parse(localStorage.getItem('oras_saved_festivals') || '[]');
        setIsSaved(saved.some(f => f.name === festival.name));
      } catch (e) {}

      // Fetch wiki data
      const fetchWiki = async () => {
        const wikiTitle = festival.name.split(' / ')[0].replace(/ /g, '_');
        setLoading(true);
        setError(null);
        
        try {
          const CACHE_KEY = `wiki_fest_${wikiTitle}`;
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 86400000) { // 24h
              setWikiData(parsed.data);
              setLoading(false);
              return;
            }
          }

          const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`);
          if (!res.ok) throw new Error('Failed to fetch Wikipedia data');
          const data = await res.json();
          
          const result = {
            title: data.title,
            extract: data.extract,
            description: data.description,
            thumbnail: data.thumbnail?.source,
            originalImage: data.originalimage?.source,
            wikiUrl: data.content_urls?.desktop?.page
          };
          
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: result }));
          setWikiData(result);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchWiki();
    }
  }, [open, festival]);

  const toggleSave = () => {
    try {
      let saved = JSON.parse(localStorage.getItem('oras_saved_festivals') || '[]');
      if (isSaved) {
        saved = saved.filter(f => f.name !== festival.name);
        toast.success("Removed from bookmarks");
      } else {
        saved.push({ ...festival, id: festival.name });
        toast.success("Saved to bookmarks");
      }
      localStorage.setItem('oras_saved_festivals', JSON.stringify(saved));
      setIsSaved(!isSaved);
      // Dispatch event to sync with FestivalInfo if open
      window.dispatchEvent(new Event('oras_bookmarks_changed'));
    } catch (e) {}
  };

  const shareFestival = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: festival.name,
          text: `Check out ${festival.name} on ${festival.date}!`,
          url: wikiData?.wikiUrl || window.location.href,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${festival.name} - ${wikiData?.wikiUrl}`);
      toast.success("Link copied to clipboard");
    }
  };

  if (!festival) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[2rem] gap-0 border border-white/10 bg-card/80 backdrop-blur-2xl">
        <ScrollArea className="max-h-[85vh]">
          {/* Hero Image Section */}
          <div className="relative h-64 w-full bg-muted/30">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                <LoadingSpinner inline className="w-8 h-8 animate-spin text-primary/50" />
              </div>
            ) : wikiData?.originalImage ? (
              <img 
                src={wikiData.originalImage} 
                alt={festival.name} 
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center`}>
                <Calendar className="w-16 h-16 text-primary/30" />
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            {/* Hero Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex gap-2 mb-2">
                <span className="px-2 py-1 bg-white/20 backdrop-blur text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                  {festival.type || 'Festival'}
                </span>
              </div>
              <DialogTitle className="text-2xl font-bold text-white mb-1 leading-tight">
                {festival.name}
              </DialogTitle>
              <DialogDescription className="text-white/80 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {festival.date}
                </span>
                {wikiData?.description && (
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    {wikiData.description}
                  </span>
                )}
              </DialogDescription>
            </div>
            
            {/* Top Actions */}
            <div className="absolute top-4 right-4 flex gap-2 z-50">
              <button onClick={toggleSave} className="p-2.5 rounded-full bg-black/40 backdrop-blur border border-white/10 text-white hover:bg-black/60 transition-colors">
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
              </button>
              <button onClick={shareFestival} className="p-2.5 rounded-full bg-black/40 backdrop-blur border border-white/10 text-white hover:bg-black/60 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={() => onOpenChange(false)} className="p-2.5 rounded-full bg-black/40 backdrop-blur border border-white/10 text-white hover:bg-black/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary */}
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase text-primary mb-3">About</h4>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                  <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
                </div>
              ) : error ? (
                <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-2xl italic">
                  Additional details could not be loaded.
                </p>
              ) : (
                <p className="text-sm text-foreground leading-relaxed">
                  {wikiData?.extract || "No detailed summary available."}
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase text-primary mb-3">Country</h4>
              <p className="text-sm text-foreground leading-relaxed">
                {festival.country || 'India'}
              </p>
            </div>

            {/* History */}
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase text-primary mb-3">History</h4>
              <p className="text-sm text-foreground leading-relaxed">
                {festival.history || 'Discover the rich historical background of this festival on Wikipedia.'}
              </p>
            </div>

            {/* Traditions */}
            <div>
              <h4 className="text-sm font-bold tracking-wide uppercase text-primary mb-3">Traditions</h4>
              <p className="text-sm text-foreground leading-relaxed">
                {festival.traditions || 'Celebrated with deep cultural rituals and joyous traditions.'}
              </p>
            </div>

            {/* Read More Button */}
            {wikiData?.wikiUrl && (
              <Button 
                variant="outline" 
                className="w-full rounded-2xl h-12 gap-2 border-border/50 bg-muted/20 hover:bg-muted/40"
                onClick={() => window.open(wikiData.wikiUrl, '_blank')}
              >
                Read Full Article on Wikipedia <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
