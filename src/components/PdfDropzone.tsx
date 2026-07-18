import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";

const MAX_MB = 50;

export function PdfDropzone({
  multiple,
  files,
  onChange,
  helper,
}: {
  multiple: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  helper?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(list: File[]): File[] {
    const good: File[] = [];
    for (const f of list) {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        setError(`"${f.name}" is not a PDF.`);
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`"${f.name}" is larger than ${MAX_MB} MB.`);
        continue;
      }
      good.push(f);
    }
    return good;
  }

  function handle(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    const good = validate(Array.from(list));
    if (multiple) onChange([...files, ...good]);
    else onChange(good.slice(0, 1));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handle(e.dataTransfer.files);
  }

  function remove(idx: number) {
    onChange(files.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...files];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-3xl border-2 border-dashed p-10 md:p-14 text-center transition-all ${
          dragging
            ? "border-primary bg-accent scale-[1.01]"
            : "border-border bg-card hover:border-primary/50 hover:bg-accent/40"
        }`}
        role="button"
        tabIndex={0}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-soft animate-float">
          <Upload className="h-6 w-6" />
        </div>
        <p className="mt-4 text-lg font-semibold">
          Drop {multiple ? "PDFs" : "a PDF"} here or click to browse
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {helper ?? `Max ${MAX_MB} MB per file · processed in your browser`}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple={multiple}
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => handle(e.target.files)}
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-5 space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(f.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {multiple && files.length > 1 && (
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      move(i, -1);
                    }}
                    disabled={i === 0}
                    className="px-2 py-1 rounded-md hover:bg-accent disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      move(i, 1);
                    }}
                    disabled={i === files.length - 1}
                    className="px-2 py-1 rounded-md hover:bg-accent disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i);
                }}
                className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
