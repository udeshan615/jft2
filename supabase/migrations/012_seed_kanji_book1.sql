-- Seed Irodoori Book 1 → Lesson 「Kanji ලිවීම」 from KANJI-ALL.pdf
-- Safe to re-run: uses fixed slug and deletes prior seed for that slug only.

DO $$
DECLARE
  v_book_id UUID;
  v_lesson_id UUID;
BEGIN
  -- Book
  SELECT id INTO v_book_id FROM public.content_collections
  WHERE kind = 'kanji_book' AND slug = 'irodoori-book-1' LIMIT 1;

  IF v_book_id IS NULL THEN
    INSERT INTO public.content_collections (
      kind, title, description, slug, book_number, sort_order, status, is_active_version
    ) VALUES (
      'kanji_book',
      'Irodoori Book 1',
      'IRODOORI – BOOK 01 (KANJI)',
      'irodoori-book-1',
      1,
      1,
      'published',
      true
    ) RETURNING id INTO v_book_id;
  ELSE
    UPDATE public.content_collections SET
      title = 'Irodoori Book 1',
      description = 'IRODOORI – BOOK 01 (KANJI)',
      status = 'published',
      is_active_version = true,
      book_number = 1
    WHERE id = v_book_id;
  END IF;

  -- Lesson
  SELECT id INTO v_lesson_id FROM public.learning_modules
  WHERE collection_id = v_book_id AND title = 'Kanji ලිවීම' LIMIT 1;

  IF v_lesson_id IS NULL THEN
    INSERT INTO public.learning_modules (
      collection_id, title, description, section_key, lesson_number, sort_order, status, intro_youtube_url
    ) VALUES (
      v_book_id,
      'Kanji ලිවීම',
      'Book 1 writing practice',
      'pictures_kanji',
      1,
      1,
      'published',
      NULL
    ) RETURNING id INTO v_lesson_id;
  ELSE
    UPDATE public.learning_modules SET
      status = 'published',
      lesson_number = 1,
      sort_order = 1
    WHERE id = v_lesson_id;
  END IF;

  -- Replace kanji for this lesson with PDF order
  DELETE FROM public.kanji_entries WHERE module_id = v_lesson_id;

  INSERT INTO public.kanji_entries (
    collection_id, module_id, kanji, reading, meaning_si, meaning_en, sort_order, status, lesson_number
  ) VALUES
    (v_book_id, v_lesson_id, '名前', 'なまえ', 'නම', 'name', 1, 'published', 1),
    (v_book_id, v_lesson_id, '国', 'くに', 'රට', 'country', 2, 'published', 1),
    (v_book_id, v_lesson_id, '私', 'わたし', 'මම', 'I / me', 3, 'published', 1),
    (v_book_id, v_lesson_id, '父', 'ちち', 'තාත්තා', 'father', 4, 'published', 1),
    (v_book_id, v_lesson_id, '母', 'はは', 'අම්මා', 'mother', 5, 'published', 1),
    (v_book_id, v_lesson_id, '子ども', 'こども', 'ළමයා', 'child', 6, 'published', 1),
    (v_book_id, v_lesson_id, '日本', 'にほん', 'ජපානය', 'Japan', 7, 'published', 1),
    (v_book_id, v_lesson_id, '水', 'みず', 'ජලය', 'water', 8, 'published', 1),
    (v_book_id, v_lesson_id, '食べます', 'たべます', 'කනවා', 'to eat', 9, 'published', 1),
    (v_book_id, v_lesson_id, '飲みます', 'のみます', 'බොනවා', 'to drink', 10, 'published', 1),
    (v_book_id, v_lesson_id, '魚', 'さかな', 'මාළු', 'fish', 11, 'published', 1),
    (v_book_id, v_lesson_id, '肉', 'にく', 'මස්', 'meat', 12, 'published', 1),
    (v_book_id, v_lesson_id, '好きな', 'すきな', 'කැමති', 'liked / favorite', 13, 'published', 1),
    (v_book_id, v_lesson_id, '家', 'いえ', 'නිවස', 'house', 14, 'published', 1),
    (v_book_id, v_lesson_id, '新しい', 'あたらしい', 'අලුත්', 'new', 15, 'published', 1),
    (v_book_id, v_lesson_id, '広い', 'ひろい', 'පුළුල්', 'wide / spacious', 16, 'published', 1),
    (v_book_id, v_lesson_id, '古い', 'ふるい', 'පරණ', 'old', 17, 'published', 1),
    (v_book_id, v_lesson_id, '上', 'うえ', 'උඩ', 'up / above', 18, 'published', 1),
    (v_book_id, v_lesson_id, '下', 'した', 'යට', 'down / below', 19, 'published', 1),
    (v_book_id, v_lesson_id, '中', 'なか', 'ඇතුළ', 'inside / middle', 20, 'published', 1),
    (v_book_id, v_lesson_id, '日曜日', 'にちようび', 'ඉරිදා', 'Sunday', 21, 'published', 1),
    (v_book_id, v_lesson_id, '月曜日', 'げつようび', 'සඳුදා', 'Monday', 22, 'published', 1),
    (v_book_id, v_lesson_id, '火曜日', 'かようび', 'අඟහරුවාදා', 'Tuesday', 23, 'published', 1),
    (v_book_id, v_lesson_id, '水曜日', 'すいようび', 'බදාදා', 'Wednesday', 24, 'published', 1),
    (v_book_id, v_lesson_id, '木曜日', 'もくようび', 'බ්‍රහස්පතින්දා', 'Thursday', 25, 'published', 1),
    (v_book_id, v_lesson_id, '金曜日', 'きんようび', 'සිකුරාදා', 'Friday', 26, 'published', 1),
    (v_book_id, v_lesson_id, '土曜日', 'どようび', 'සෙනසුරාදා', 'Saturday', 27, 'published', 1),
    (v_book_id, v_lesson_id, '朝', 'あさ', 'උදේ', 'morning', 28, 'published', 1),
    (v_book_id, v_lesson_id, '昼', 'ひる', 'දවල්', 'noon / daytime', 29, 'published', 1),
    (v_book_id, v_lesson_id, '夜', 'よる', 'රෑ', 'night', 30, 'published', 1),
    (v_book_id, v_lesson_id, '時', 'じ', 'පැය / වේලාව', 'o''clock / time', 31, 'published', 1),
    (v_book_id, v_lesson_id, '分', 'ふん', 'මිනිත්තු', 'minute', 32, 'published', 1),
    (v_book_id, v_lesson_id, '半', 'はん', 'අඩක්', 'half', 33, 'published', 1),
    (v_book_id, v_lesson_id, '枚', 'まい', 'පත්‍ර ගණන් කිරීමේ ඒකකය', 'counter for flat objects', 34, 'published', 1),
    (v_book_id, v_lesson_id, '読みます', 'よみます', 'කියවනවා', 'to read', 35, 'published', 1),
    (v_book_id, v_lesson_id, '聞きます', 'ききます', 'අසනවා', 'to listen / hear', 36, 'published', 1),
    (v_book_id, v_lesson_id, '見ます', 'みます', 'බලනවා', 'to see / watch', 37, 'published', 1),
    (v_book_id, v_lesson_id, '本', 'ほん', 'පොත', 'book', 38, 'published', 1),
    (v_book_id, v_lesson_id, '友', 'とも', 'යාළුවා', 'friend (part)', 39, 'published', 1),
    (v_book_id, v_lesson_id, '何', 'なに', 'මොකක්ද', 'what', 40, 'published', 1),
    (v_book_id, v_lesson_id, '年', 'ねん/とし', 'අවුරුදු', 'year', 41, 'published', 1),
    (v_book_id, v_lesson_id, '月', 'つき、がつ', 'මාසය', 'month / moon', 42, 'published', 1),
    (v_book_id, v_lesson_id, '日', 'ひ', 'දවස', 'day / sun', 43, 'published', 1),
    (v_book_id, v_lesson_id, '今日', 'きょう', 'අද', 'today', 44, 'published', 1),
    (v_book_id, v_lesson_id, '今週', 'こんしゅう', 'මේ සතිය', 'this week', 45, 'published', 1),
    (v_book_id, v_lesson_id, '今度', 'こんど', 'මෙවර / ඊළඟ වතාව', 'this time / next time', 46, 'published', 1),
    (v_book_id, v_lesson_id, '今', 'いま', 'දැන්', 'now', 47, 'published', 1),
    (v_book_id, v_lesson_id, '東', 'ひがし', 'නැගෙනහිර', 'east', 48, 'published', 1),
    (v_book_id, v_lesson_id, '南', 'みなみ', 'දකුණ', 'south', 49, 'published', 1),
    (v_book_id, v_lesson_id, '西', 'にし', 'බටහිර', 'west', 50, 'published', 1),
    (v_book_id, v_lesson_id, '北', 'きた', 'උතුර', 'north', 51, 'published', 1),
    (v_book_id, v_lesson_id, '会社', 'かいしゃ', 'සමාගම', 'company', 52, 'published', 1),
    (v_book_id, v_lesson_id, '来ます', 'きます', 'එනවා', 'to come', 53, 'published', 1),
    (v_book_id, v_lesson_id, '行きます', 'いきます', 'යනවා', 'to go', 54, 'published', 1),
    (v_book_id, v_lesson_id, '乗ります', 'のります', 'නගිනවා', 'to ride / board', 55, 'published', 1),
    (v_book_id, v_lesson_id, '大きい', 'おおきい', 'ලොකු', 'big', 56, 'published', 1),
    (v_book_id, v_lesson_id, '小さい', 'ちいさい', 'කුඩා', 'small', 57, 'published', 1),
    (v_book_id, v_lesson_id, '高い', 'たかい', 'උස / මිල අධික', 'tall / expensive', 58, 'published', 1),
    (v_book_id, v_lesson_id, '低い', 'ひくい', 'අඩු උස', 'low / short', 59, 'published', 1),
    (v_book_id, v_lesson_id, '前', 'まえ', 'ඉදිරිපස / කලින්', 'front / before', 60, 'published', 1),
    (v_book_id, v_lesson_id, '後ろ', 'うしろ', 'පිටුපස', 'behind', 61, 'published', 1),
    (v_book_id, v_lesson_id, '横', 'よこ', 'පැත්තෙන්', 'side', 62, 'published', 1),
    (v_book_id, v_lesson_id, '入口', 'いりぐち', 'ඇතුළුවීමේ දොරටුව', 'entrance', 63, 'published', 1),
    (v_book_id, v_lesson_id, '出口', 'でぐち', 'පිටවීමේ දොරටුව', 'exit', 64, 'published', 1),
    (v_book_id, v_lesson_id, '階', 'かい', 'මහල', 'floor / storey', 65, 'published', 1),
    (v_book_id, v_lesson_id, '押す', 'おす', 'ඔබනවා', 'to push', 66, 'published', 1),
    (v_book_id, v_lesson_id, '引く', 'ひく', 'අදිනවා', 'to pull', 67, 'published', 1),
    (v_book_id, v_lesson_id, '安い', 'やすい', 'ලාභ', 'cheap', 68, 'published', 1),
    (v_book_id, v_lesson_id, '一', 'いち', 'එක', 'one', 69, 'published', 1),
    (v_book_id, v_lesson_id, '二', 'に', 'දෙක', 'two', 70, 'published', 1),
    (v_book_id, v_lesson_id, '三', 'さん', 'තුන', 'three', 71, 'published', 1),
    (v_book_id, v_lesson_id, '四', 'よん、し', 'හතර', 'four', 72, 'published', 1),
    (v_book_id, v_lesson_id, '五', 'ご', 'පහ', 'five', 73, 'published', 1),
    (v_book_id, v_lesson_id, '六', 'ろく', 'හය', 'six', 74, 'published', 1),
    (v_book_id, v_lesson_id, '七', 'なな、しち', 'හත', 'seven', 75, 'published', 1),
    (v_book_id, v_lesson_id, '八', 'はち', 'අට', 'eight', 76, 'published', 1),
    (v_book_id, v_lesson_id, '九', 'きゅう、く', 'නවය', 'nine', 77, 'published', 1),
    (v_book_id, v_lesson_id, '十', 'じゅう', 'දහය', 'ten', 78, 'published', 1),
    (v_book_id, v_lesson_id, '百', 'ひゃく', 'සිය', 'hundred', 79, 'published', 1),
    (v_book_id, v_lesson_id, '万', 'まん', 'දාහක්', 'ten thousand', 80, 'published', 1),
    (v_book_id, v_lesson_id, '千', 'せん', 'දහස', 'thousand', 81, 'published', 1),
    (v_book_id, v_lesson_id, '円', 'えん', 'යෙන්', 'yen', 82, 'published', 1),
    (v_book_id, v_lesson_id, '休み', 'やすみ', 'නිවාඩු / විවේකය', 'rest / holiday', 83, 'published', 1),
    (v_book_id, v_lesson_id, '映画', 'えいが', 'චිත්‍රපටය', 'movie', 84, 'published', 1),
    (v_book_id, v_lesson_id, '日本語', 'にほんご', 'ජපන් භාෂාව', 'Japanese language', 85, 'published', 1),
    (v_book_id, v_lesson_id, '勉強します', 'べんきょうします', 'ඉගෙනගන්නවා / අධ්‍යයනය කරනවා', 'to study', 86, 'published', 1),
    (v_book_id, v_lesson_id, '買います', 'かいます', 'මිලදී ගන්නවා', 'to buy', 87, 'published', 1),
    (v_book_id, v_lesson_id, '温泉', 'おんせん', 'උණු දිය උල්පත', 'hot spring', 88, 'published', 1),
    (v_book_id, v_lesson_id, '予定', 'よてい', 'සැලැස්ම / කාලසටහන', 'plan / schedule', 89, 'published', 1),
    (v_book_id, v_lesson_id, '来週', 'らいしゅう', 'ලබන සතිය', 'next week', 90, 'published', 1),
    (v_book_id, v_lesson_id, '会います', 'あいます', 'හමුවෙනවා', 'to meet', 91, 'published', 1),
    (v_book_id, v_lesson_id, '入ります', 'はいります', 'ඇතුළු වෙනවා', 'to enter', 92, 'published', 1),
    (v_book_id, v_lesson_id, '旅行します', 'りょこうします', 'සංචාරය කරනවා', 'to travel', 93, 'published', 1);
END $$;
