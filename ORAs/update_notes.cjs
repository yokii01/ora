const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Notes.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const newComponent = `
// ═══ Brand New Note Preview Architecture ═══
function NotePreviewScreen({ viewNote, onClose, onShare, onEdit }) {
  const hasThemeBg = viewNote.background && viewNote.background !== 'none';
  const themeBgStyle = hasThemeBg ? getBackgroundStyle(viewNote.background) : {};
  const hasImages = Array.isArray(viewNote.images) && viewNote.images.length > 0;
  // If the first image exists, we treat it as the hero cover
  const coverImage = hasImages ? viewNote.images[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[999] overflow-y-auto no-scrollbar flex flex-col bg-background text-foreground"
    >
      {/* 1. Continuous Background Underlay */}
      {hasThemeBg && (
        <div 
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: themeBgStyle.backgroundImage,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>
      )}

      {/* 2. Floating Header (Glassmorphism) */}
      <div className={cn(
        "sticky top-0 z-50 flex items-center justify-between p-4 sm:px-6 backdrop-blur-2xl border-b transition-colors",
        hasThemeBg ? "bg-black/40 border-white/10" : "bg-background/80 border-border/50"
      )}>
        <button 
          onClick={onClose} 
          className={cn(
            "p-2.5 rounded-full transition-colors flex items-center justify-center shadow-sm",
            hasThemeBg ? "bg-white/10 hover:bg-white/20 text-white" : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
          )}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex gap-3">
          <button 
            onClick={onShare} 
            className={cn(
              "px-4 py-2.5 rounded-full transition-colors flex items-center gap-2 shadow-sm font-semibold text-sm",
              hasThemeBg ? "bg-white/10 hover:bg-white/20 text-white" : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
            )}
          >
            <Share className="w-4 h-4" /> <span className="hidden sm:inline">Share</span>
          </button>
          <button 
            onClick={onEdit} 
            className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center gap-2 shadow-md font-bold text-sm hover:scale-105"
          >
            <Pencil className="w-4 h-4" /> <span>Edit</span>
          </button>
        </div>
      </div>

      {/* 3. Main Scrollable Content */}
      <div className="relative z-10 pb-32 flex flex-col flex-1">
        
        {/* Hero Area */}
        {coverImage ? (
          <div className="relative w-full h-[260px] sm:h-[320px] shrink-0">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover rounded-b-[2rem]" />
            <div className="absolute inset-0 rounded-b-[2rem] bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        ) : hasThemeBg ? (
          <div className="w-full h-[120px] sm:h-[160px] shrink-0" />
        ) : (
          <div className="w-full h-[200px] sm:h-[240px] shrink-0 rounded-b-[2rem] bg-gradient-to-br from-primary/20 via-background to-muted" />
        )}

        {/* Content Card */}
        <div className={cn(
          "max-w-4xl w-full mx-auto px-4 sm:px-8 shrink-0 flex-1",
          (coverImage || !hasThemeBg) ? "-mt-16 sm:-mt-24" : ""
        )}>
          <div className={cn(
            "rounded-[2rem] p-6 sm:p-10 shadow-2xl backdrop-blur-2xl border",
            hasThemeBg ? "bg-black/60 border-white/10 text-white" : "bg-card/90 border-border/50 text-foreground"
          )}>
            
            {/* Title & Metadata */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight break-words">
              {viewNote.title || 'Untitled Note'}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className={cn("flex items-center gap-1.5 text-sm font-medium", hasThemeBg ? "text-white/70" : "text-muted-foreground")}>
                <Calendar className="w-4 h-4" />
                {viewNote.updated_date ? new Date(viewNote.updated_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Just now'}
              </span>
              {viewNote.folder && (
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                  hasThemeBg ? "bg-white/10 border-white/20 text-white" : "bg-primary/10 border-primary/20 text-primary"
                )}>
                  <Folder className="w-3.5 h-3.5 inline mr-1" /> {viewNote.folder}
                </span>
              )}
              {viewNote.tags?.map(t => (
                <span key={t} className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border shadow-sm",
                  hasThemeBg ? "bg-white/10 border-white/10 text-white/90" : "bg-background border-border/50 text-foreground"
                )}>
                  #{t}
                </span>
              ))}
            </div>

            {/* Note Body Render */}
            <div className="ql-snow">
              <div 
                className={cn(
                  "ql-editor prose prose-base sm:prose-lg max-w-none px-0 py-0 break-words",
                  hasThemeBg ? "prose-invert text-white/90" : "dark:prose-invert text-foreground"
                )}
                style={{ overflowY: 'visible', minHeight: 'auto' }}
              >
                {viewNote.content ? (
                  <div dangerouslySetInnerHTML={{ __html: viewNote.content }} />
                ) : (
                  <p className={cn("italic", hasThemeBg ? "text-white/40" : "text-muted-foreground")}>Empty note.</p>
                )}
              </div>
            </div>

            {/* Attachments (Gallery & Audio) */}
            {(hasImages || viewNote.audio) && (
              <div className={cn("mt-10 pt-8 border-t space-y-8", hasThemeBg ? "border-white/10" : "border-border/50")}>
                {hasImages && (
                  <PhotoGallery images={viewNote.images} />
                )}
                {viewNote.audio && (
                  <div>
                    <p className={cn("text-sm font-bold flex items-center gap-2 mb-3", hasThemeBg ? "text-white/80" : "text-muted-foreground")}>
                      <Mic className="w-4 h-4" /> Voice Note
                    </p>
                    <AudioPlayer src={viewNote.audio} />
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Notes() {
`;

content = content.replace('export default function Notes() {', newComponent);

const startMarker = '{/* ═══ View-only Note Full-Page Preview ═══ */}';
const endMarker = '{/* ═══ Templates Dialog ═══ */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newPreviewCall = `{/* ═══ View-only Note Full-Page Preview ═══ */}
      <AnimatePresence>
        {viewNote && (
          <NotePreviewScreen 
            viewNote={viewNote} 
            onClose={() => setViewNote(null)} 
            onShare={() => shareNote(viewNote)} 
            onEdit={() => openEdit(viewNote)} 
          />
        )}
      </AnimatePresence>

      `;
  content = content.substring(0, startIndex) + newPreviewCall + content.substring(endIndex);
  fs.writeFileSync(filePath, content);
  console.log("Successfully rebuilt Notes Preview Architecture!");
} else {
  console.error("Markers not found");
}
