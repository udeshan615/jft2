-- Seed Irodoori Book 1 from official vocabulary list (DOCX) — 93 items
DO $$
DECLARE
  v_book_id UUID;
  v_lesson_id UUID;
BEGIN
  SELECT id INTO v_book_id FROM public.content_collections
  WHERE kind = 'kanji_book' AND slug = 'irodoori-book-1' LIMIT 1;

  IF v_book_id IS NULL THEN
    INSERT INTO public.content_collections (
      kind, title, description, slug, book_number, sort_order, status, is_active_version
    ) VALUES (
      'kanji_book', 'Irodoori Book 1', 'IRODOORI – BOOK 01 (KANJI)',
      'irodoori-book-1', 1, 1, 'published', true
    ) RETURNING id INTO v_book_id;
  ELSE
    UPDATE public.content_collections SET
      title = 'Irodoori Book 1', description = 'IRODOORI – BOOK 01 (KANJI)',
      status = 'published', is_active_version = true, book_number = 1
    WHERE id = v_book_id;
  END IF;

  SELECT id INTO v_lesson_id FROM public.learning_modules
  WHERE collection_id = v_book_id AND title = 'Kanji ලිවීම' LIMIT 1;

  IF v_lesson_id IS NULL THEN
    INSERT INTO public.learning_modules (
      collection_id, title, description, section_key, lesson_number, sort_order, status, intro_youtube_url
    ) VALUES (
      v_book_id, 'Kanji ලිවීම', 'Book 1 writing practice', 'pictures_kanji', 1, 1, 'published', NULL
    ) RETURNING id INTO v_lesson_id;
  ELSE
    UPDATE public.learning_modules SET status = 'published', lesson_number = 1, sort_order = 1
    WHERE id = v_lesson_id;
  END IF;

  DELETE FROM public.kanji_entries WHERE module_id = v_lesson_id;

  INSERT INTO public.kanji_entries (
    collection_id, module_id, kanji, reading, meaning_si, meaning_en, sort_order, status, lesson_number
  ) VALUES
    (v_book_id, v_lesson_id, '名前', 'なまえ', 'නම', NULL, 1, 'published', 1),
    (v_book_id, v_lesson_id, '国', 'くに', 'රට', NULL, 2, 'published', 1),
    (v_book_id, v_lesson_id, '私', 'わたし', 'මම', NULL, 3, 'published', 1),
    (v_book_id, v_lesson_id, '父', 'ちち', 'තාත්තා', NULL, 4, 'published', 1),
    (v_book_id, v_lesson_id, '母', 'はは', 'අම්මා', NULL, 5, 'published', 1),
    (v_book_id, v_lesson_id, '子ども', 'こども', 'ළමයා', NULL, 6, 'published', 1),
    (v_book_id, v_lesson_id, '日本', 'にほん', 'ජපානය', NULL, 7, 'published', 1),
    (v_book_id, v_lesson_id, '水', 'みず', 'වතුර', NULL, 8, 'published', 1),
    (v_book_id, v_lesson_id, '食べます', 'たべます', 'කනවා', NULL, 9, 'published', 1),
    (v_book_id, v_lesson_id, '飲みます', 'のみます', 'බොනවා', NULL, 10, 'published', 1),
    (v_book_id, v_lesson_id, '魚', 'さかな', 'මාලුවා', NULL, 11, 'published', 1),
    (v_book_id, v_lesson_id, '肉', 'にく', 'මස්', NULL, 12, 'published', 1),
    (v_book_id, v_lesson_id, '好きな', 'すきな', 'කැමති', NULL, 13, 'published', 1),
    (v_book_id, v_lesson_id, '家', 'いえ', 'ගෙදර', NULL, 14, 'published', 1),
    (v_book_id, v_lesson_id, '新しい', 'あたらしい', 'අලුත්', NULL, 15, 'published', 1),
    (v_book_id, v_lesson_id, '広い', 'ひろい', 'පළල්', NULL, 16, 'published', 1),
    (v_book_id, v_lesson_id, '古い', 'ふるい', 'පරණ', NULL, 17, 'published', 1),
    (v_book_id, v_lesson_id, '上', 'うえ', 'උඩ', NULL, 18, 'published', 1),
    (v_book_id, v_lesson_id, '下', 'した', 'යට', NULL, 19, 'published', 1),
    (v_book_id, v_lesson_id, '中', 'なか', 'තුල', NULL, 20, 'published', 1),
    (v_book_id, v_lesson_id, '日曜日', 'にちようび', 'ඉරිදා', NULL, 21, 'published', 1),
    (v_book_id, v_lesson_id, '月曜日', 'げつようび', 'සදුදා', NULL, 22, 'published', 1),
    (v_book_id, v_lesson_id, '火曜日', 'かようび', 'අඟහරුවාදා', NULL, 23, 'published', 1),
    (v_book_id, v_lesson_id, '水曜日', 'すいようび', 'බදාදා', NULL, 24, 'published', 1),
    (v_book_id, v_lesson_id, '木曜日', 'もくようび', 'බ්‍රහස්පතින්දා', NULL, 25, 'published', 1),
    (v_book_id, v_lesson_id, '金曜日', 'きんようび', 'සිකුරාදා', NULL, 26, 'published', 1),
    (v_book_id, v_lesson_id, '土曜日', 'どようび', 'සෙනසුරාදා', NULL, 27, 'published', 1),
    (v_book_id, v_lesson_id, '朝', 'あさ', 'උදේ', NULL, 28, 'published', 1),
    (v_book_id, v_lesson_id, '昼', 'ひる', 'දවල්', NULL, 29, 'published', 1),
    (v_book_id, v_lesson_id, '夜', 'よる', 'රෑ', NULL, 30, 'published', 1),
    (v_book_id, v_lesson_id, '時', 'じ', 'පැය/වේලාව', NULL, 31, 'published', 1),
    (v_book_id, v_lesson_id, '分', 'ふん・ぷん', 'මිනිත්තු', NULL, 32, 'published', 1),
    (v_book_id, v_lesson_id, '半', 'はん', 'භාගය', NULL, 33, 'published', 1),
    (v_book_id, v_lesson_id, '枚', 'まい', 'සිහින් පැතලි දේවල් ගණන් කිරීමේ පසු යෙදුම', NULL, 34, 'published', 1),
    (v_book_id, v_lesson_id, '読みます', 'よみます', 'කියනවා', NULL, 35, 'published', 1),
    (v_book_id, v_lesson_id, '聞きます', 'ききます', 'අසනවා', NULL, 36, 'published', 1),
    (v_book_id, v_lesson_id, '見ます', 'みます', 'බලනවා', NULL, 37, 'published', 1),
    (v_book_id, v_lesson_id, '本', 'ほん', 'පොත්', NULL, 38, 'published', 1),
    (v_book_id, v_lesson_id, '友だち', 'ともだち', 'යාළුවා', NULL, 39, 'published', 1),
    (v_book_id, v_lesson_id, '何', 'なに', 'මොකද්ද', NULL, 40, 'published', 1),
    (v_book_id, v_lesson_id, '年', 'ねん/とし', 'අවුරුද්ද', NULL, 41, 'published', 1),
    (v_book_id, v_lesson_id, '月', 'つき・がつ', 'මාසය', NULL, 42, 'published', 1),
    (v_book_id, v_lesson_id, '日', 'ひ', 'දවස', NULL, 43, 'published', 1),
    (v_book_id, v_lesson_id, '今日', 'きょう', 'අද', NULL, 44, 'published', 1),
    (v_book_id, v_lesson_id, '今週', 'こんしゅう', 'මේ සතිය', NULL, 45, 'published', 1),
    (v_book_id, v_lesson_id, '今度', 'こんど', 'මෙවර/ඊලග පාර', NULL, 46, 'published', 1),
    (v_book_id, v_lesson_id, '今', 'いま', 'දැන්', NULL, 47, 'published', 1),
    (v_book_id, v_lesson_id, '東', 'ひがし', 'නැගෙනහිර', NULL, 48, 'published', 1),
    (v_book_id, v_lesson_id, '南', 'みなみ', 'දකුණ', NULL, 49, 'published', 1),
    (v_book_id, v_lesson_id, '西', 'にし', 'බටහිර', NULL, 50, 'published', 1),
    (v_book_id, v_lesson_id, '北', 'きた', 'උතුර', NULL, 51, 'published', 1),
    (v_book_id, v_lesson_id, '会社', 'かいしゃ', 'සමාගම', NULL, 52, 'published', 1),
    (v_book_id, v_lesson_id, '来ます', 'きます', 'එනවා', NULL, 53, 'published', 1),
    (v_book_id, v_lesson_id, '行きます', 'いきます', 'යනවා', NULL, 54, 'published', 1),
    (v_book_id, v_lesson_id, '乗ります', 'のります', 'නගිනවා (වාහනයකට)', NULL, 55, 'published', 1),
    (v_book_id, v_lesson_id, '大きい', 'おおきい', 'විශාලයි', NULL, 56, 'published', 1),
    (v_book_id, v_lesson_id, '小さい', 'ちいさい', 'කුඩා', NULL, 57, 'published', 1),
    (v_book_id, v_lesson_id, '高い', 'たかい', 'උසයි/මිල අධිකයි', NULL, 58, 'published', 1),
    (v_book_id, v_lesson_id, '低い', 'ひくい', 'මිටි', NULL, 59, 'published', 1),
    (v_book_id, v_lesson_id, '前', 'まえ', 'ඉදිරිපිට/පෙර', NULL, 60, 'published', 1),
    (v_book_id, v_lesson_id, '後ろ', 'うしろ', 'පිටුපස', NULL, 61, 'published', 1),
    (v_book_id, v_lesson_id, '横', 'よこ', 'පැත්තකින්', NULL, 62, 'published', 1),
    (v_book_id, v_lesson_id, '入口', 'いりぐち', 'ඇතුල්වීමේ දොරටුව', NULL, 63, 'published', 1),
    (v_book_id, v_lesson_id, '出口', 'でぐち', 'පිටවීමේ දොරටුව', NULL, 64, 'published', 1),
    (v_book_id, v_lesson_id, '階', 'かい', 'ගොඩනැගිල්ලක තට්ටු ගණන් කිරීමේ පසු යෙදුම', NULL, 65, 'published', 1),
    (v_book_id, v_lesson_id, '押す', 'おす', 'ඔබනවා/තල්ලු කරනවා', NULL, 66, 'published', 1),
    (v_book_id, v_lesson_id, '引く', 'ひく', 'අදිනවා', NULL, 67, 'published', 1),
    (v_book_id, v_lesson_id, '安い', 'やすい', 'ලාභ', NULL, 68, 'published', 1),
    (v_book_id, v_lesson_id, '一', 'いち', 'එක', NULL, 69, 'published', 1),
    (v_book_id, v_lesson_id, '二', 'に', 'දෙක', NULL, 70, 'published', 1),
    (v_book_id, v_lesson_id, '三', 'さん', 'තුන', NULL, 71, 'published', 1),
    (v_book_id, v_lesson_id, '四', 'よん・し', 'හතර', NULL, 72, 'published', 1),
    (v_book_id, v_lesson_id, '五', 'ご', 'පහ', NULL, 73, 'published', 1),
    (v_book_id, v_lesson_id, '六', 'ろく', 'හය', NULL, 74, 'published', 1),
    (v_book_id, v_lesson_id, '七', 'なな・しち', 'හත', NULL, 75, 'published', 1),
    (v_book_id, v_lesson_id, '八', 'はち', 'අට', NULL, 76, 'published', 1),
    (v_book_id, v_lesson_id, '九', 'きゅう・く', 'නවය', NULL, 77, 'published', 1),
    (v_book_id, v_lesson_id, '十', 'じゅう', 'දහය', NULL, 78, 'published', 1),
    (v_book_id, v_lesson_id, '百', 'ひゃく', 'සිය', NULL, 79, 'published', 1),
    (v_book_id, v_lesson_id, '万', 'まん', 'දහදාහ', NULL, 80, 'published', 1),
    (v_book_id, v_lesson_id, '千', 'せん', 'දාහ', NULL, 81, 'published', 1),
    (v_book_id, v_lesson_id, '円', 'えん', 'යෙන්', NULL, 82, 'published', 1),
    (v_book_id, v_lesson_id, '休み', 'やすみ', 'නිවාඩුව/විවේකය', NULL, 83, 'published', 1),
    (v_book_id, v_lesson_id, '映画', 'えいが', 'චිත්‍රපටිය', NULL, 84, 'published', 1),
    (v_book_id, v_lesson_id, '日本語', 'にほんご', 'ජපන් භාෂාව', NULL, 85, 'published', 1),
    (v_book_id, v_lesson_id, '勉強します', 'べんきょうします', 'ඉගෙනගන්නවා/පාඩම් කරනවා', NULL, 86, 'published', 1),
    (v_book_id, v_lesson_id, '買います', 'かいます', 'මිලදී ගන්නවා', NULL, 87, 'published', 1),
    (v_book_id, v_lesson_id, '温泉', 'おんせん', 'උණු දිය උල්පත', NULL, 88, 'published', 1),
    (v_book_id, v_lesson_id, '予定', 'よてい', 'සැලැස්ම/කාලසටහන', NULL, 89, 'published', 1),
    (v_book_id, v_lesson_id, '来週', 'らいしゅう', 'ලබන සතිය', NULL, 90, 'published', 1),
    (v_book_id, v_lesson_id, '会います', 'あいます', 'හමුවෙනවා', NULL, 91, 'published', 1),
    (v_book_id, v_lesson_id, '入ります', 'はいります', 'ඇතුල් වෙනවා', NULL, 92, 'published', 1),
    (v_book_id, v_lesson_id, '旅行します', 'りょこうします', 'සංචාරය කරනවා', NULL, 93, 'published', 1);
END $$;
