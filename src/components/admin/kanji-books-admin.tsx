'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

type Book = {
  id: string;
  title: string;
  description: string | null;
  book_number: number | null;
  sort_order: number;
  status: string;
};

type Lesson = {
  id: string;
  collection_id: string;
  title: string;
  description: string | null;
  lesson_number: number | null;
  sort_order: number;
  intro_youtube_url: string | null;
  status: string;
};

type Entry = {
  id: string;
  module_id: string | null;
  kanji: string;
  reading: string | null;
  meaning_si: string | null;
  meaning_en: string | null;
  sort_order: number;
  status: string;
};

interface Props {
  books: Book[];
  lessons: Lesson[];
  entries: Entry[];
  adminId: string;
}

export function KanjiBooksAdmin({
  books: initialBooks,
  lessons: initialLessons,
  entries: initialEntries,
  adminId,
}: Props) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [lessons, setLessons] = useState(initialLessons);
  const [entries, setEntries] = useState(initialEntries);
  const [openBook, setOpenBook] = useState<string | null>(initialBooks[0]?.id ?? null);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [editBook, setEditBook] = useState<Partial<Book> | null>(null);
  const [editLesson, setEditLesson] = useState<Partial<Lesson> | null>(null);
  const [editEntry, setEditEntry] = useState<Partial<Entry> & { module_id?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function saveBook() {
    if (!editBook?.title) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      kind: 'kanji_book' as const,
      title: editBook.title,
      description: editBook.description || null,
      book_number: editBook.book_number ?? null,
      sort_order: editBook.sort_order ?? 0,
      status: editBook.status || 'draft',
      is_active_version: (editBook.status || 'draft') === 'published',
      updated_by: adminId,
    };
    if (editBook.id) {
      const { error } = await supabase
        .from('content_collections')
        .update(payload)
        .eq('id', editBook.id);
      if (error) setMsg(error.message);
      else setMsg('Book saved');
    } else {
      const { data, error } = await supabase
        .from('content_collections')
        .insert({ ...payload, created_by: adminId })
        .select('id, title, description, book_number, sort_order, status')
        .single();
      if (error) setMsg(error.message);
      else if (data) {
        setBooks((b) => [...b, data as Book]);
        setMsg('Book created');
      }
    }
    setEditBook(null);
    setSaving(false);
    refresh();
  }

  async function deleteBook(id: string) {
    if (!confirm('Delete this book and all its lessons/kanji?')) return;
    const supabase = createClient();
    await supabase.from('content_collections').delete().eq('id', id);
    setBooks((b) => b.filter((x) => x.id !== id));
    setLessons((l) => l.filter((x) => x.collection_id !== id));
    refresh();
  }

  async function saveLesson() {
    if (!editLesson?.title || !editLesson.collection_id) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      collection_id: editLesson.collection_id,
      title: editLesson.title,
      description: editLesson.description || null,
      lesson_number: editLesson.lesson_number ?? null,
      sort_order: editLesson.sort_order ?? 0,
      intro_youtube_url: editLesson.intro_youtube_url?.trim() || null,
      status: editLesson.status || 'draft',
      section_key: 'pictures_kanji',
      updated_by: adminId,
    };
    if (editLesson.id) {
      const { error } = await supabase
        .from('learning_modules')
        .update(payload)
        .eq('id', editLesson.id);
      if (error) setMsg(error.message);
      else setMsg('Lesson saved');
    } else {
      const { data, error } = await supabase
        .from('learning_modules')
        .insert({ ...payload, created_by: adminId })
        .select(
          'id, collection_id, title, description, lesson_number, sort_order, intro_youtube_url, status'
        )
        .single();
      if (error) setMsg(error.message);
      else if (data) {
        setLessons((l) => [...l, data as Lesson]);
        setMsg('Lesson created');
      }
    }
    setEditLesson(null);
    setSaving(false);
    refresh();
  }

  async function deleteLesson(id: string) {
    if (!confirm('Delete this lesson and its kanji?')) return;
    const supabase = createClient();
    await supabase.from('learning_modules').delete().eq('id', id);
    setLessons((l) => l.filter((x) => x.id !== id));
    setEntries((e) => e.filter((x) => x.module_id !== id));
    refresh();
  }

  async function saveEntry() {
    if (!editEntry?.kanji || !editEntry.module_id) return;
    setSaving(true);
    const supabase = createClient();
    const lesson = lessons.find((l) => l.id === editEntry.module_id);
    const payload = {
      collection_id: lesson?.collection_id,
      module_id: editEntry.module_id,
      kanji: editEntry.kanji.trim(),
      reading: editEntry.reading?.trim() || null,
      meaning_si: editEntry.meaning_si?.trim() || null,
      meaning_en: editEntry.meaning_en?.trim() || null,
      sort_order: editEntry.sort_order ?? 0,
      status: editEntry.status || 'published',
      updated_by: adminId,
    };
    if (editEntry.id) {
      const { error } = await supabase
        .from('kanji_entries')
        .update(payload)
        .eq('id', editEntry.id);
      if (error) setMsg(error.message);
      else setMsg('Kanji saved');
    } else {
      const { data, error } = await supabase
        .from('kanji_entries')
        .insert({ ...payload, created_by: adminId })
        .select(
          'id, module_id, kanji, reading, meaning_si, meaning_en, sort_order, status'
        )
        .single();
      if (error) setMsg(error.message);
      else if (data) {
        setEntries((e) => [...e, data as Entry]);
        setMsg('Kanji added');
      }
    }
    setEditEntry(null);
    setSaving(false);
    refresh();
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this kanji entry?')) return;
    const supabase = createClient();
    await supabase.from('kanji_entries').delete().eq('id', id);
    setEntries((e) => e.filter((x) => x.id !== id));
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#123f6b]">Kanji Books</h1>
          <p className="text-sm text-muted-foreground">
            Books → Lessons → Kanji. Manage intro YouTube URL per lesson.
          </p>
        </div>
        <Button
          className="gap-1.5 bg-[#123f6b] hover:bg-[#0e3256]"
          onClick={() =>
            setEditBook({
              title: '',
              description: '',
              book_number: books.length + 1,
              sort_order: books.length,
              status: 'draft',
            })
          }
        >
          <Plus className="h-4 w-4" /> Add book
        </Button>
      </div>

      {msg && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>
      )}

      <div className="space-y-3">
        {books.map((book) => {
          const bookLessons = lessons
            .filter((l) => l.collection_id === book.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          const isOpen = openBook === book.id;
          return (
            <Card key={book.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-2 text-left"
                    onClick={() => setOpenBook(isOpen ? null : book.id)}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <span className="font-semibold">{book.title}</span>
                    <Badge variant={book.status === 'published' ? 'success' : 'muted'}>
                      {book.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Book {book.book_number ?? '—'} · {bookLessons.length} lessons
                    </span>
                  </button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditBook({ ...book })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => deleteBook(book.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditLesson({
                          collection_id: book.id,
                          title: '',
                          sort_order: bookLessons.length,
                          lesson_number: bookLessons.length + 1,
                          intro_youtube_url: '',
                          status: 'draft',
                        })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" /> Lesson
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-3 border-t border-border pt-3">
                    {bookLessons.map((lesson) => {
                      const lessonEntries = entries
                        .filter((e) => e.module_id === lesson.id)
                        .sort((a, b) => a.sort_order - b.sort_order);
                      const lOpen = openLesson === lesson.id;
                      return (
                        <div
                          key={lesson.id}
                          className="rounded-xl border border-border bg-muted/30 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              className="flex items-center gap-2 text-left text-sm font-medium"
                              onClick={() => setOpenLesson(lOpen ? null : lesson.id)}
                            >
                              {lOpen ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                              {lesson.title}
                              <Badge variant={lesson.status === 'published' ? 'success' : 'muted'}>
                                {lesson.status}
                              </Badge>
                              <span className="text-xs font-normal text-muted-foreground">
                                {lessonEntries.length} kanji
                                {lesson.intro_youtube_url ? ' · video' : ''}
                              </span>
                            </button>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setEditLesson({ ...lesson })}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => deleteLesson(lesson.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setEditEntry({
                                    module_id: lesson.id,
                                    kanji: '',
                                    reading: '',
                                    meaning_si: '',
                                    sort_order: lessonEntries.length,
                                    status: 'published',
                                  })
                                }
                              >
                                <Plus className="h-3.5 w-3.5" /> Kanji
                              </Button>
                            </div>
                          </div>
                          {lOpen && (
                            <div className="mt-2 space-y-1">
                              {lessonEntries.map((en, i) => (
                                <div
                                  key={en.id}
                                  className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-sm"
                                >
                                  <span>
                                    <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                                    <span className="text-lg font-medium">{en.kanji}</span>
                                    <span className="ml-2 text-muted-foreground">
                                      {en.reading}
                                    </span>
                                    <span className="ml-2">{en.meaning_si}</span>
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => setEditEntry({ ...en })}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => deleteEntry(en.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {lessonEntries.length === 0 && (
                                <p className="text-xs text-muted-foreground">No kanji yet.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {bookLessons.length === 0 && (
                      <p className="text-sm text-muted-foreground">No lessons yet.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {books.length === 0 && (
          <p className="text-sm text-muted-foreground">No books yet. Add Book 1 to start.</p>
        )}
      </div>

      {/* Book modal */}
      <Modal open={!!editBook} onClose={() => setEditBook(null)} title={editBook?.id ? 'Edit book' : 'New book'}>
        {editBook && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={editBook.title || ''}
                onChange={(e) => setEditBook({ ...editBook, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={editBook.description || ''}
                onChange={(e) => setEditBook({ ...editBook, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Book number</Label>
                <Input
                  type="number"
                  value={editBook.book_number ?? ''}
                  onChange={(e) =>
                    setEditBook({
                      ...editBook,
                      book_number: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={editBook.sort_order ?? 0}
                  onChange={(e) =>
                    setEditBook({ ...editBook, sort_order: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={editBook.status || 'draft'}
                onChange={(e) => setEditBook({ ...editBook, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>
            <Button onClick={saveBook} disabled={saving} className="gap-2">
              {saving && <Spinner className="h-4 w-4" />} Save
            </Button>
          </div>
        )}
      </Modal>

      {/* Lesson modal */}
      <Modal
        open={!!editLesson}
        onClose={() => setEditLesson(null)}
        title={editLesson?.id ? 'Edit lesson' : 'New lesson'}
      >
        {editLesson && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={editLesson.title || ''}
                onChange={(e) => setEditLesson({ ...editLesson, title: e.target.value })}
                placeholder="Kanji ලිවීම"
              />
            </div>
            <div className="space-y-1">
              <Label>Introduction YouTube URL</Label>
              <Input
                value={editLesson.intro_youtube_url || ''}
                onChange={(e) =>
                  setEditLesson({ ...editLesson, intro_youtube_url: e.target.value })
                }
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-muted-foreground">
                Embedded inside the app — users stay on the site.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Lesson number</Label>
                <Input
                  type="number"
                  value={editLesson.lesson_number ?? ''}
                  onChange={(e) =>
                    setEditLesson({
                      ...editLesson,
                      lesson_number: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={editLesson.sort_order ?? 0}
                  onChange={(e) =>
                    setEditLesson({
                      ...editLesson,
                      sort_order: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={editLesson.status || 'draft'}
                onChange={(e) => setEditLesson({ ...editLesson, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>
            <Button onClick={saveLesson} disabled={saving} className="gap-2">
              {saving && <Spinner className="h-4 w-4" />} Save
            </Button>
          </div>
        )}
      </Modal>

      {/* Kanji entry modal */}
      <Modal
        open={!!editEntry}
        onClose={() => setEditEntry(null)}
        title={editEntry?.id ? 'Edit kanji' : 'Add kanji'}
      >
        {editEntry && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Kanji / word</Label>
              <Input
                value={editEntry.kanji || ''}
                onChange={(e) => setEditEntry({ ...editEntry, kanji: e.target.value })}
                placeholder="日"
              />
            </div>
            <div className="space-y-1">
              <Label>Hiragana / reading</Label>
              <Input
                value={editEntry.reading || ''}
                onChange={(e) => setEditEntry({ ...editEntry, reading: e.target.value })}
                placeholder="ひ"
              />
            </div>
            <div className="space-y-1">
              <Label>Sinhala meaning</Label>
              <Input
                value={editEntry.meaning_si || ''}
                onChange={(e) => setEditEntry({ ...editEntry, meaning_si: e.target.value })}
                placeholder="දවස"
              />
            </div>
            <div className="space-y-1">
              <Label>English (optional)</Label>
              <Input
                value={editEntry.meaning_en || ''}
                onChange={(e) => setEditEntry({ ...editEntry, meaning_en: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={editEntry.sort_order ?? 0}
                  onChange={(e) =>
                    setEditEntry({
                      ...editEntry,
                      sort_order: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={editEntry.status || 'published'}
                  onChange={(e) => setEditEntry({ ...editEntry, status: e.target.value })}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </Select>
              </div>
            </div>
            <Button onClick={saveEntry} disabled={saving} className="gap-2">
              {saving && <Spinner className="h-4 w-4" />} Save
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
