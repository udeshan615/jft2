-- Seed Irodoori Book 2 + Book 3 (same structure as Book 1)
-- Lessons: Kanji ලිවීම + Flash Card + හරියට තෝරන්න (games rows)
DO $$
DECLARE
  v_book_id UUID;
  v_lesson_id UUID;
BEGIN

  -- ========== Book 2 ==========
  SELECT id INTO v_book_id FROM public.content_collections
  WHERE kind = 'kanji_book' AND slug = 'irodoori-book-2' LIMIT 1;
  IF v_book_id IS NULL THEN
    INSERT INTO public.content_collections (
      kind, title, description, slug, book_number, sort_order, status, is_active_version, metadata
    ) VALUES (
      'kanji_book', 'Irodoori Book 2', 'IRODOORI – BOOK 02 (KANJI)', 'irodoori-book-2', 2, 2, 'published', true,
      jsonb_build_object('book_intro_enabled', false, 'book_intro_youtube_url', '')
    ) RETURNING id INTO v_book_id;
  ELSE
    UPDATE public.content_collections SET
      title = 'Irodoori Book 2', description = 'IRODOORI – BOOK 02 (KANJI)',
      status = 'published', is_active_version = true, book_number = 2, sort_order = 2
    WHERE id = v_book_id;
  END IF;

  SELECT id INTO v_lesson_id FROM public.learning_modules
  WHERE collection_id = v_book_id AND title = 'Kanji ලිවීම' LIMIT 1;
  IF v_lesson_id IS NULL THEN
    INSERT INTO public.learning_modules (
      collection_id, title, description, section_key, lesson_number, sort_order, status, intro_youtube_url
    ) VALUES (
      v_book_id, 'Kanji ලිවීම', 'Book 2 writing practice', 'pictures_kanji', 1, 1, 'published', NULL
    ) RETURNING id INTO v_lesson_id;
  ELSE
    UPDATE public.learning_modules SET status = 'published', lesson_number = 1, sort_order = 1
    WHERE id = v_lesson_id;
  END IF;

  DELETE FROM public.kanji_entries WHERE module_id = v_lesson_id;
  INSERT INTO public.kanji_entries (
    collection_id, module_id, kanji, reading, meaning_si, meaning_en, sort_order, status, lesson_number
  ) VALUES
    (v_book_id, v_lesson_id, '学生', 'がくせい', 'ශිෂ්‍යයා', NULL, 1, 'published', 1),
    (v_book_id, v_lesson_id, '学校', 'がっこう', 'පාසල', NULL, 2, 'published', 1),
    (v_book_id, v_lesson_id, '生活', 'せいかつ', 'ජීවිතය', NULL, 3, 'published', 1),
    (v_book_id, v_lesson_id, '去年', 'きょねん', 'ගිය අවුරුද්ද', NULL, 4, 'published', 1),
    (v_book_id, v_lesson_id, '先週', 'せんしゅう', 'ගිය සතිය', NULL, 5, 'published', 1),
    (v_book_id, v_lesson_id, '仕事', 'しごと', 'රැකියාව', NULL, 6, 'published', 1),
    (v_book_id, v_lesson_id, '元気な', 'げんきな', 'නිරෝගී', NULL, 7, 'published', 1),
    (v_book_id, v_lesson_id, '忙しい', 'いそがしい', 'කාර්යබහුලයි', NULL, 8, 'published', 1),
    (v_book_id, v_lesson_id, '働く', 'はたらく', 'වැඩ කරනවා', NULL, 9, 'published', 1),
    (v_book_id, v_lesson_id, '作る', 'つくる', 'හදනවා', NULL, 10, 'published', 1),
    (v_book_id, v_lesson_id, '人', 'ひと/じん', 'පුද්ගලයා/ජාතිකයා', NULL, 11, 'published', 1),
    (v_book_id, v_lesson_id, '犬', 'いぬ', 'බල්ලා', NULL, 12, 'published', 1),
    (v_book_id, v_lesson_id, '家族', 'かぞく', 'පවුල', NULL, 13, 'published', 1),
    (v_book_id, v_lesson_id, '夕方', 'ゆうがた', 'සවස', NULL, 14, 'published', 1),
    (v_book_id, v_lesson_id, '英語', 'えいご', 'ඉංග්‍රීසි භාෂාව', NULL, 15, 'published', 1),
    (v_book_id, v_lesson_id, '音楽', 'おんがく', 'සංගීතය', NULL, 16, 'published', 1),
    (v_book_id, v_lesson_id, '習う', 'ならう', 'ඉගෙන ගන්නවා', NULL, 17, 'published', 1),
    (v_book_id, v_lesson_id, '話す', 'はなす', 'කතා කරනවා', NULL, 18, 'published', 1),
    (v_book_id, v_lesson_id, '出かける', 'でかける', 'පිටතට යනවා', NULL, 19, 'published', 1),
    (v_book_id, v_lesson_id, '季節', 'きせつ', 'ඍතුව', NULL, 20, 'published', 1),
    (v_book_id, v_lesson_id, '春', 'はる', 'වසන්ත කාලය', NULL, 21, 'published', 1),
    (v_book_id, v_lesson_id, '夏', 'なつ', 'ගිම්හාන කාලය', NULL, 22, 'published', 1),
    (v_book_id, v_lesson_id, '秋', 'あき', 'සරත් කාලය', NULL, 23, 'published', 1),
    (v_book_id, v_lesson_id, '冬', 'ふゆ', 'ශීත කාලය', NULL, 24, 'published', 1),
    (v_book_id, v_lesson_id, '花', 'はな', 'මල', NULL, 25, 'published', 1),
    (v_book_id, v_lesson_id, '同じ', 'おなじ', 'සමාන', NULL, 26, 'published', 1),
    (v_book_id, v_lesson_id, '暑い', 'あつい', 'රස්නෙයි (කාලගුණය)', NULL, 27, 'published', 1),
    (v_book_id, v_lesson_id, '寒い', 'さむい', 'සීතලයි (කාලගුණය)', NULL, 28, 'published', 1),
    (v_book_id, v_lesson_id, '天気', 'てんき', 'කාලගුණය', NULL, 29, 'published', 1),
    (v_book_id, v_lesson_id, '晴れ', 'はれ', 'පැහැදිලි කාලගුණය', NULL, 30, 'published', 1),
    (v_book_id, v_lesson_id, '雨', 'あめ', 'වැස්ස', NULL, 31, 'published', 1),
    (v_book_id, v_lesson_id, '雪', 'ゆき', 'හිම', NULL, 32, 'published', 1),
    (v_book_id, v_lesson_id, '風', 'かぜ', 'සුළඟ', NULL, 33, 'published', 1),
    (v_book_id, v_lesson_id, '今', 'いま', 'දැන්', NULL, 34, 'published', 1),
    (v_book_id, v_lesson_id, '昨日', 'きのう', 'ඊයේ', NULL, 35, 'published', 1),
    (v_book_id, v_lesson_id, '明日', 'あした', 'හෙට', NULL, 36, 'published', 1),
    (v_book_id, v_lesson_id, '毎日', 'まいにち', 'හැමදාම', NULL, 37, 'published', 1),
    (v_book_id, v_lesson_id, '強い', 'つよい', 'ශක්තිමත්/ප්‍රබල', NULL, 38, 'published', 1),
    (v_book_id, v_lesson_id, '町', 'まち', 'නගරය', NULL, 39, 'published', 1),
    (v_book_id, v_lesson_id, '店', 'みせ', 'කඩය', NULL, 40, 'published', 1),
    (v_book_id, v_lesson_id, '食堂', 'しょくどう', 'ආපන ශාලාව', NULL, 41, 'published', 1),
    (v_book_id, v_lesson_id, '便利な', 'べんりな', 'සැප පහසු', NULL, 42, 'published', 1),
    (v_book_id, v_lesson_id, '不便な', 'ふべんな', 'අපහසු', NULL, 43, 'published', 1),
    (v_book_id, v_lesson_id, '静かな', 'しずかな', 'නිහඬ', NULL, 44, 'published', 1),
    (v_book_id, v_lesson_id, '有名な', 'ゆうめいな', 'ප්‍රසිද්ධ', NULL, 45, 'published', 1),
    (v_book_id, v_lesson_id, '多い', 'おおい', 'බහුල', NULL, 46, 'published', 1),
    (v_book_id, v_lesson_id, '少ない', 'すくない', 'ස්වල්ප/අඩු', NULL, 47, 'published', 1),
    (v_book_id, v_lesson_id, '遠い', 'とおい', 'දුර', NULL, 48, 'published', 1),
    (v_book_id, v_lesson_id, '道', 'みち', 'පාර', NULL, 49, 'published', 1),
    (v_book_id, v_lesson_id, '公園', 'こうえん', 'උද්‍යානය', NULL, 50, 'published', 1),
    (v_book_id, v_lesson_id, '銀行', 'ぎんこう', 'බැංකුව', NULL, 51, 'published', 1),
    (v_book_id, v_lesson_id, 'お寺', 'おてら', 'පන්සල', NULL, 52, 'published', 1),
    (v_book_id, v_lesson_id, '神社', 'じんじゃ', 'ශින්තෝ දේවාලය', NULL, 53, 'published', 1),
    (v_book_id, v_lesson_id, '右', 'みぎ', 'දකුණ', NULL, 54, 'published', 1),
    (v_book_id, v_lesson_id, '左', 'ひだり', 'වම', NULL, 55, 'published', 1),
    (v_book_id, v_lesson_id, '近く', 'ちかく', 'ළඟින්', NULL, 56, 'published', 1),
    (v_book_id, v_lesson_id, '車', 'くるま', 'කාර් එක/වාහනය', NULL, 57, 'published', 1),
    (v_book_id, v_lesson_id, '送る', 'おくる', 'යවනවා', NULL, 58, 'published', 1),
    (v_book_id, v_lesson_id, '時間', 'じかん', 'වේලාව/පැය ගණන', NULL, 59, 'published', 1),
    (v_book_id, v_lesson_id, '場所', 'ばしょ', 'ස්ථානය', NULL, 60, 'published', 1),
    (v_book_id, v_lesson_id, '駅', 'えき', 'දුම්රිය ස්ථානය', NULL, 61, 'published', 1),
    (v_book_id, v_lesson_id, '受付', 'うけつけ', 'reception', NULL, 62, 'published', 1),
    (v_book_id, v_lesson_id, '門', 'もん', 'ඇවුම/දොරටුව', NULL, 63, 'published', 1),
    (v_book_id, v_lesson_id, '電車', 'でんしゃ', 'දුම්රිය', NULL, 64, 'published', 1),
    (v_book_id, v_lesson_id, '待つ', 'まつ', 'රැඳී සිටිනවා', NULL, 65, 'published', 1),
    (v_book_id, v_lesson_id, '止まる', 'とまる', 'නවත්වනවා', NULL, 66, 'published', 1),
    (v_book_id, v_lesson_id, '着く', 'つく', 'පැමිණෙනවා/ළඟා වෙනවා', NULL, 67, 'published', 1),
    (v_book_id, v_lesson_id, '急ぐ', 'いそぐ', 'ඉක්මන් කරනවා', NULL, 68, 'published', 1),
    (v_book_id, v_lesson_id, 'お金', 'おかね', 'සල්ලි', NULL, 69, 'published', 1),
    (v_book_id, v_lesson_id, '食事', 'しょくじ', 'කෑම/ආහාර ගන්නා ක්‍රියාව', NULL, 70, 'published', 1),
    (v_book_id, v_lesson_id, '博物館', 'はくぶつかん', 'විද්‍යාගාරය/කෞතුකාගාරය', NULL, 71, 'published', 1),
    (v_book_id, v_lesson_id, '動物園', 'どうぶつえん', 'සත්තු උද්‍යානය', NULL, 72, 'published', 1),
    (v_book_id, v_lesson_id, '試合', 'しあい', 'තරඟය/ක්‍රීඩා තරඟය', NULL, 73, 'published', 1),
    (v_book_id, v_lesson_id, '楽しい', 'たのしい', 'විනෝදජනක/සතුටක් දෙන', NULL, 74, 'published', 1),
    (v_book_id, v_lesson_id, '難しい', 'むずかしい', 'අමාරු', NULL, 75, 'published', 1),
    (v_book_id, v_lesson_id, '登る', 'のぼる', 'නගිනවා (කඳු/පඩිපෙළ)', NULL, 76, 'published', 1),
    (v_book_id, v_lesson_id, '高校', 'こうこう', 'උසස් පාසල', NULL, 77, 'published', 1),
    (v_book_id, v_lesson_id, '大学', 'だいがく', 'විශ්වවිද්‍යාලය', NULL, 78, 'published', 1),
    (v_book_id, v_lesson_id, '練習', 'れんしゅう', 'අභ්‍යාසය', NULL, 79, 'published', 1),
    (v_book_id, v_lesson_id, '漢字', 'かんじ', 'කන්ජි අකුරු', NULL, 80, 'published', 1),
    (v_book_id, v_lesson_id, '無料', 'むりょう', 'නොමිලේ', NULL, 81, 'published', 1),
    (v_book_id, v_lesson_id, '言う', 'いう', 'කියනවා', NULL, 82, 'published', 1),
    (v_book_id, v_lesson_id, '書く', 'かく', 'ලියනවා', NULL, 83, 'published', 1),
    (v_book_id, v_lesson_id, '貸す', 'かす', 'ණයට දෙනවා', NULL, 84, 'published', 1),
    (v_book_id, v_lesson_id, '教える', 'おしえる', 'උගන්වනවා', NULL, 85, 'published', 1),
    (v_book_id, v_lesson_id, '説明する', 'せつめいする', 'විස්තර කරනවා', NULL, 86, 'published', 1),
    (v_book_id, v_lesson_id, '午前', 'ごぜん', 'උදෑසන', NULL, 87, 'published', 1),
    (v_book_id, v_lesson_id, '午後', 'ごご', 'සවස', NULL, 88, 'published', 1),
    (v_book_id, v_lesson_id, '教科書', 'きょうかしょ', 'පාඩම් පොත', NULL, 89, 'published', 1),
    (v_book_id, v_lesson_id, '教室', 'きょうしつ', 'පන්ති කාමරය', NULL, 90, 'published', 1),
    (v_book_id, v_lesson_id, '先生', 'せんせい', 'ගුරුවරයා', NULL, 91, 'published', 1),
    (v_book_id, v_lesson_id, '～回', 'かい', 'වාර ගණන', NULL, 92, 'published', 1),
    (v_book_id, v_lesson_id, '参加する', 'さんかする', 'සහභාගී වෙනවා', NULL, 93, 'published', 1),
    (v_book_id, v_lesson_id, '用意する', 'よういする', 'සූදානම් කරනවා', NULL, 94, 'published', 1),
    (v_book_id, v_lesson_id, '飲み物', 'のみもの', 'බීම ජාති', NULL, 95, 'published', 1),
    (v_book_id, v_lesson_id, 'お茶', 'おちゃ', 'තේ', NULL, 96, 'published', 1),
    (v_book_id, v_lesson_id, 'お酒', 'おさけ', 'ජපන් මත්පැන්', NULL, 97, 'published', 1),
    (v_book_id, v_lesson_id, '材料', 'ざいりょう', 'අමුද්‍රව්‍ය', NULL, 98, 'published', 1),
    (v_book_id, v_lesson_id, '野菜', 'やさい', 'එළවලු', NULL, 99, 'published', 1),
    (v_book_id, v_lesson_id, '牛肉', 'ぎゅうにく', 'හරක්මස්', NULL, 100, 'published', 1),
    (v_book_id, v_lesson_id, '豚肉', 'ぶたにく', 'ඌරු මස්', NULL, 101, 'published', 1),
    (v_book_id, v_lesson_id, '皿', 'さら', 'පිඟාන/තහඩු', NULL, 102, 'published', 1),
    (v_book_id, v_lesson_id, '売る', 'うる', 'විකුණනවා', NULL, 103, 'published', 1),
    (v_book_id, v_lesson_id, '持って行く', 'もっていく', 'රැගෙන යනවා', NULL, 104, 'published', 1),
    (v_book_id, v_lesson_id, '卵', 'たまご', 'බිත්තර', NULL, 105, 'published', 1),
    (v_book_id, v_lesson_id, '料理', 'りょうり', 'කෑම/ආහාර පිසීම', NULL, 106, 'published', 1),
    (v_book_id, v_lesson_id, 'お湯', 'おゆ', 'උණු වතුර', NULL, 107, 'published', 1),
    (v_book_id, v_lesson_id, '調理方法', 'ちょうりほうほう', 'ආහාර පිසීමේ ක්‍රමය', NULL, 108, 'published', 1),
    (v_book_id, v_lesson_id, '少し', 'すこし', 'ටිකක්', NULL, 109, 'published', 1),
    (v_book_id, v_lesson_id, '味', 'あじ', 'රසය', NULL, 110, 'published', 1),
    (v_book_id, v_lesson_id, '甘い', 'あまい', 'පැණි රස/මෘදු රස', NULL, 111, 'published', 1),
    (v_book_id, v_lesson_id, '辛い', 'からい', 'සැර රස/කටේ දැවෙන රස', NULL, 112, 'published', 1),
    (v_book_id, v_lesson_id, '苦手な', 'にがてな', 'අසනීප/දුර්වල', NULL, 113, 'published', 1),
    (v_book_id, v_lesson_id, 'コピー機', 'コピーき', 'පිටපත් යන්ත්‍රය', NULL, 114, 'published', 1),
    (v_book_id, v_lesson_id, '数字', 'すうじ', 'ඉලක්කම්', NULL, 115, 'published', 1),
    (v_book_id, v_lesson_id, '電気', 'でんき', 'විදුලිය', NULL, 116, 'published', 1),
    (v_book_id, v_lesson_id, '音', 'おと', 'ශබ්දය', NULL, 117, 'published', 1),
    (v_book_id, v_lesson_id, '机', 'つくえ', 'මේසය', NULL, 118, 'published', 1),
    (v_book_id, v_lesson_id, '都合', 'つごう', 'තත්වය/අවස්ථාව', NULL, 119, 'published', 1),
    (v_book_id, v_lesson_id, '悪い', 'わるい', 'නරක/අපහසු', NULL, 120, 'published', 1),
    (v_book_id, v_lesson_id, '動く', 'うごく', 'චලනය වීම/ගමන් කරනවා', NULL, 121, 'published', 1),
    (v_book_id, v_lesson_id, '使う', 'つかう', 'භාවිතා කරනවා', NULL, 122, 'published', 1),
    (v_book_id, v_lesson_id, '終わる', 'おわる', 'අවසන් කරනවා', NULL, 123, 'published', 1),
    (v_book_id, v_lesson_id, 'お願いします', '', 'කරුණාකර/කරුණාවෙන් ඉල්ලීමක්', NULL, 124, 'published', 1),
    (v_book_id, v_lesson_id, '用事', 'ようじ', 'කාර්යය/ව්‍යාපාරයක්', NULL, 125, 'published', 1),
    (v_book_id, v_lesson_id, '氏名', 'しめい', 'සම්පූර්ණ නම', NULL, 126, 'published', 1),
    (v_book_id, v_lesson_id, '理由', 'りゆう', 'හේතුව', NULL, 127, 'published', 1),
    (v_book_id, v_lesson_id, '連絡先', 'れんらくさき', 'දැනුම් දීම් ලිපිනය/සම්බන්ධතා තැන', NULL, 128, 'published', 1),
    (v_book_id, v_lesson_id, '別に', 'べつに', 'වෙන වෙනම/විශේෂ නොවූවක් ලෙස', NULL, 129, 'published', 1),
    (v_book_id, v_lesson_id, '早く', 'はやく', 'ඉක්මනින්/වේගයෙන්', NULL, 130, 'published', 1),
    (v_book_id, v_lesson_id, '吸う', 'すう', 'දුම් අදිනවා', NULL, 131, 'published', 1),
    (v_book_id, v_lesson_id, '取る', 'とる', 'ගන්නවා/පත් කරනවා', NULL, 132, 'published', 1),
    (v_book_id, v_lesson_id, '帰る', 'かえる', 'ආපසු යනවා/ගෙදර යනවා', NULL, 133, 'published', 1),
    (v_book_id, v_lesson_id, '伝える', 'つたえる', 'දන්වනවා/පවසනවා', NULL, 134, 'published', 1),
    (v_book_id, v_lesson_id, '熱', 'ねつ', 'උණ/උෂ්ණත්වය', NULL, 135, 'published', 1),
    (v_book_id, v_lesson_id, '薬', 'くすり', 'ඖෂධය', NULL, 136, 'published', 1),
    (v_book_id, v_lesson_id, '病気', 'びょうき', 'රෝගය/අසනීපය', NULL, 137, 'published', 1),
    (v_book_id, v_lesson_id, '病院', 'びょういん', 'රෝහල', NULL, 138, 'published', 1),
    (v_book_id, v_lesson_id, '医者', 'いしゃ', 'වෛද්‍යවරයා', NULL, 139, 'published', 1),
    (v_book_id, v_lesson_id, '住所', 'じゅうしょ', 'ලිපිනය', NULL, 140, 'published', 1),
    (v_book_id, v_lesson_id, '～才', 'さい', 'වයස (පසු යෙදෙන පදය)', NULL, 141, 'published', 1),
    (v_book_id, v_lesson_id, '痛い', 'いたい', 'වේදනාකාරී', NULL, 142, 'published', 1),
    (v_book_id, v_lesson_id, '眠い', 'ねむい', 'නිදිමත', NULL, 143, 'published', 1),
    (v_book_id, v_lesson_id, '寝る', 'ねる', 'නිදාගන්නවා/විවේක ගන්නවා', NULL, 144, 'published', 1),
    (v_book_id, v_lesson_id, '記入する', 'きにゅうする', 'ඇතුළත් කරනවා', NULL, 145, 'published', 1),
    (v_book_id, v_lesson_id, '体', 'からだ', 'ශරීරය/දේහය', NULL, 146, 'published', 1),
    (v_book_id, v_lesson_id, '顔', 'かお', 'මුහුණ', NULL, 147, 'published', 1),
    (v_book_id, v_lesson_id, '目', 'め', 'ඇස', NULL, 148, 'published', 1),
    (v_book_id, v_lesson_id, '耳', 'みみ', 'කන', NULL, 149, 'published', 1),
    (v_book_id, v_lesson_id, '口', 'くち', 'කට', NULL, 150, 'published', 1),
    (v_book_id, v_lesson_id, '頭', 'あたま', 'හිස', NULL, 151, 'published', 1),
    (v_book_id, v_lesson_id, '足', 'あし', 'කකුල', NULL, 152, 'published', 1),
    (v_book_id, v_lesson_id, '手', 'て', 'අත', NULL, 153, 'published', 1),
    (v_book_id, v_lesson_id, '起きる', 'おきる', 'අවදි වෙනවා/නැගිටිනවා', NULL, 154, 'published', 1),
    (v_book_id, v_lesson_id, '歩く', 'あるく', 'ඇවිදිනවා', NULL, 155, 'published', 1),
    (v_book_id, v_lesson_id, '走る', 'はしる', 'දුවනවා/දිවිනවා', NULL, 156, 'published', 1),
    (v_book_id, v_lesson_id, '運動する', 'うんどうする', 'ව්‍යායාම කරනවා', NULL, 157, 'published', 1),
    (v_book_id, v_lesson_id, 'お父さん', 'おとうさん', 'තාත්තා', NULL, 158, 'published', 1),
    (v_book_id, v_lesson_id, 'お母さん', 'おかあさん', 'අම්මා', NULL, 159, 'published', 1),
    (v_book_id, v_lesson_id, '兄', 'あに', 'අයියා (තමාගේ අයියා)', NULL, 160, 'published', 1),
    (v_book_id, v_lesson_id, 'お兄さん', 'おにいさん', 'අයියා (අනෙකාගේ අයියා)', NULL, 161, 'published', 1),
    (v_book_id, v_lesson_id, '姉', 'あね', 'අක්කා (තමාගේ අක්කා)', NULL, 162, 'published', 1),
    (v_book_id, v_lesson_id, 'お姉さん', 'おねえさん', 'අක්කා (අනෙකාගේ අක්කා)', NULL, 163, 'published', 1),
    (v_book_id, v_lesson_id, '弟', 'おとうと', 'මල්ලි', NULL, 164, 'published', 1),
    (v_book_id, v_lesson_id, '妹', 'いもうと', 'නංගි', NULL, 165, 'published', 1),
    (v_book_id, v_lesson_id, '夫', 'おっと', 'සැමියා', NULL, 166, 'published', 1),
    (v_book_id, v_lesson_id, '妻', 'つま', 'බිරිඳ', NULL, 167, 'published', 1),
    (v_book_id, v_lesson_id, '両親', 'りょうしん', 'දෙමාපියන්', NULL, 168, 'published', 1),
    (v_book_id, v_lesson_id, '男の子', 'おとこのこ', 'පිරිමි ළමයා', NULL, 169, 'published', 1),
    (v_book_id, v_lesson_id, '女の子', 'おんなのこ', 'ගැහැණු ළමයා', NULL, 170, 'published', 1),
    (v_book_id, v_lesson_id, 'お祝い', 'おいわい', 'සුභ පැතීම/සැමරීම', NULL, 171, 'published', 1),
    (v_book_id, v_lesson_id, '誕生日', 'たんじょうび', 'උපන්දිනය', NULL, 172, 'published', 1),
    (v_book_id, v_lesson_id, '結婚', 'けっこん', 'විවාහය', NULL, 173, 'published', 1),
    (v_book_id, v_lesson_id, '時計', 'とけい', 'ඔරලෝසුව/වේලාව', NULL, 174, 'published', 1),
    (v_book_id, v_lesson_id, '幸せな', 'しあわせな', 'ප්‍රීතිය/වාසනාවන්ත', NULL, 175, 'published', 1),
    (v_book_id, v_lesson_id, '生まれる', 'うまれる', 'ඉපදෙනවා', NULL, 176, 'published', 1),
    (v_book_id, v_lesson_id, '思う', 'おもう', 'සිතනවා', NULL, 177, 'published', 1),
    (v_book_id, v_lesson_id, '選ぶ', 'えらぶ', 'තේරෙනවා/තෝරනවා', NULL, 178, 'published', 1),
    (v_book_id, v_lesson_id, '合格する', 'ごうかくする', 'සමත් වෙනවා', NULL, 179, 'published', 1);

  INSERT INTO public.kanji_games (
    collection_id, game_key, title, title_si, description,
    intro_enabled, intro_youtube_url, summary, is_enabled, sort_order
  ) VALUES
  (
    v_book_id, 'flash_card', 'Flash Card', 'Flash Card',
    'Practice Book 2 Kanji using interactive flash cards.',
    false, NULL,
    'මෙම game එක මඟින් Book 2 හි Kanji හඳුනාගැනීම සහ ඒවාට අදාළ වචන මතක තබාගැනීම පුහුණු කළ හැක.',
    true, 1
  ),
  (
    v_book_id, 'choose_correct', 'හරියට තෝරන්න', 'හරියට තෝරන්න',
    'Choose the correct answer for Book 2 Kanji.',
    false, NULL,
    'මෙම game එකෙන් Book 2 Kanji සඳහා නිවැරදි ජපන් වචනය සහ සිංහල අර්ථය තෝරා ගැනීම පුහුණු වේ.',
    true, 2
  )
  ON CONFLICT (collection_id, game_key) DO NOTHING;


  -- ========== Book 3 ==========
  SELECT id INTO v_book_id FROM public.content_collections
  WHERE kind = 'kanji_book' AND slug = 'irodoori-book-3' LIMIT 1;
  IF v_book_id IS NULL THEN
    INSERT INTO public.content_collections (
      kind, title, description, slug, book_number, sort_order, status, is_active_version, metadata
    ) VALUES (
      'kanji_book', 'Irodoori Book 3', 'IRODOORI – BOOK 03 (KANJI)', 'irodoori-book-3', 3, 3, 'published', true,
      jsonb_build_object('book_intro_enabled', false, 'book_intro_youtube_url', '')
    ) RETURNING id INTO v_book_id;
  ELSE
    UPDATE public.content_collections SET
      title = 'Irodoori Book 3', description = 'IRODOORI – BOOK 03 (KANJI)',
      status = 'published', is_active_version = true, book_number = 3, sort_order = 3
    WHERE id = v_book_id;
  END IF;

  SELECT id INTO v_lesson_id FROM public.learning_modules
  WHERE collection_id = v_book_id AND title = 'Kanji ලිවීම' LIMIT 1;
  IF v_lesson_id IS NULL THEN
    INSERT INTO public.learning_modules (
      collection_id, title, description, section_key, lesson_number, sort_order, status, intro_youtube_url
    ) VALUES (
      v_book_id, 'Kanji ලිවීම', 'Book 3 writing practice', 'pictures_kanji', 1, 1, 'published', NULL
    ) RETURNING id INTO v_lesson_id;
  ELSE
    UPDATE public.learning_modules SET status = 'published', lesson_number = 1, sort_order = 1
    WHERE id = v_lesson_id;
  END IF;

  DELETE FROM public.kanji_entries WHERE module_id = v_lesson_id;
  INSERT INTO public.kanji_entries (
    collection_id, module_id, kanji, reading, meaning_si, meaning_en, sort_order, status, lesson_number
  ) VALUES
    (v_book_id, v_lesson_id, '山', 'やま', 'කන්ද', NULL, 1, 'published', 1),
    (v_book_id, v_lesson_id, '川', 'かわ', 'ගඟ', NULL, 2, 'published', 1),
    (v_book_id, v_lesson_id, '海', 'うみ', 'මුහුද', NULL, 3, 'published', 1),
    (v_book_id, v_lesson_id, '島', 'しま', 'දූපත', NULL, 4, 'published', 1),
    (v_book_id, v_lesson_id, '森', 'もり', 'වනාන්තරය', NULL, 5, 'published', 1),
    (v_book_id, v_lesson_id, '客', 'きゃく', 'පාරිභෝගිකයා', NULL, 6, 'published', 1),
    (v_book_id, v_lesson_id, '観光地', 'かんこうち', 'සංචාරක ස්ථානය', NULL, 7, 'published', 1),
    (v_book_id, v_lesson_id, '意味', 'いみ', 'තේරුම', NULL, 8, 'published', 1),
    (v_book_id, v_lesson_id, '経験', 'けいけん', 'අත්දැකීම', NULL, 9, 'published', 1),
    (v_book_id, v_lesson_id, '写真', 'しゃしん', 'ඡායාරූපය', NULL, 10, 'published', 1),
    (v_book_id, v_lesson_id, '歌', 'うた', 'සින්දුව', NULL, 11, 'published', 1),
    (v_book_id, v_lesson_id, '歌手', 'かしゅ', 'ගායකයා', NULL, 12, 'published', 1),
    (v_book_id, v_lesson_id, '上手な', 'じょうずな', 'දක්ෂ', NULL, 13, 'published', 1),
    (v_book_id, v_lesson_id, '明るい', 'あかるい', 'දීප්තිමත්', NULL, 14, 'published', 1),
    (v_book_id, v_lesson_id, '長い', 'ながい', 'දිග', NULL, 15, 'published', 1),
    (v_book_id, v_lesson_id, '短い', 'みじかい', 'කෙටි', NULL, 16, 'published', 1),
    (v_book_id, v_lesson_id, '着る', 'きる', 'ඇදුම් ඇඳීම', NULL, 17, 'published', 1),
    (v_book_id, v_lesson_id, '立つ', 'たつ', 'නැගී සිටීම', NULL, 18, 'published', 1),
    (v_book_id, v_lesson_id, '泣く', 'なく', 'අඬනවා', NULL, 19, 'published', 1),
    (v_book_id, v_lesson_id, '注文', 'ちゅうもん', 'ඇණවුම', NULL, 20, 'published', 1),
    (v_book_id, v_lesson_id, '会計', 'かいけい', 'ගිණුම්කරණය', NULL, 21, 'published', 1),
    (v_book_id, v_lesson_id, '予約', 'よやく', 'වෙන් කිරීම', NULL, 22, 'published', 1),
    (v_book_id, v_lesson_id, '電話番号', 'でんわばんごう', 'දුරකථන අංකය', NULL, 23, 'published', 1),
    (v_book_id, v_lesson_id, '～様', 'さま', 'Mr/Mrs', NULL, 24, 'published', 1),
    (v_book_id, v_lesson_id, 'ご飯', 'ごはん', 'කෑම/බත්', NULL, 25, 'published', 1),
    (v_book_id, v_lesson_id, '牛乳', 'ぎゅうにゅう', 'කිරි', NULL, 26, 'published', 1),
    (v_book_id, v_lesson_id, '生', 'なま', 'අමු/ස්වභාවික', NULL, 27, 'published', 1),
    (v_book_id, v_lesson_id, '禁煙', 'きんえん', 'දුම්පානය තහනම්', NULL, 28, 'published', 1),
    (v_book_id, v_lesson_id, '自由', 'じゆう', 'නිදහස', NULL, 29, 'published', 1),
    (v_book_id, v_lesson_id, '塩', 'しお', 'ලුණු', NULL, 30, 'published', 1),
    (v_book_id, v_lesson_id, '油', 'あぶら', 'තෙල්', NULL, 31, 'published', 1),
    (v_book_id, v_lesson_id, '量', 'りょう', 'ප්‍රමාණය', NULL, 32, 'published', 1),
    (v_book_id, v_lesson_id, '～方', 'かた', 'ක්‍රමය/Method', NULL, 33, 'published', 1),
    (v_book_id, v_lesson_id, '～屋', 'や', 'ව්‍යාපාරික ස්ථානය', NULL, 34, 'published', 1),
    (v_book_id, v_lesson_id, '満足な', 'まんぞくな', 'සෑහීමට පත්', NULL, 35, 'published', 1),
    (v_book_id, v_lesson_id, '切る', 'きる', 'කපා දමනවා', NULL, 36, 'published', 1),
    (v_book_id, v_lesson_id, '焼く', 'やく', 'පිසීම/දැවීම', NULL, 37, 'published', 1),
    (v_book_id, v_lesson_id, '入れる', 'いれる', 'ඇතුල් කරනවා/දමනවා', NULL, 38, 'published', 1),
    (v_book_id, v_lesson_id, '自然', 'しぜん', 'ස්වභාවය', NULL, 39, 'published', 1),
    (v_book_id, v_lesson_id, '交通', 'こうつう', 'ගමනාගමන', NULL, 40, 'published', 1),
    (v_book_id, v_lesson_id, '船', 'ふね', 'නෞකාව', NULL, 41, 'published', 1),
    (v_book_id, v_lesson_id, '自転車', 'じてんしゃ', 'බයිසිකලය', NULL, 42, 'published', 1),
    (v_book_id, v_lesson_id, '旅館', 'りょかん', 'ජපන් හෝටලය', NULL, 43, 'published', 1),
    (v_book_id, v_lesson_id, '東京', 'とうきょう', 'ටෝකියෝ', NULL, 44, 'published', 1),
    (v_book_id, v_lesson_id, '計画', 'けいかく', 'සැලසුම', NULL, 45, 'published', 1),
    (v_book_id, v_lesson_id, '遊ぶ', 'あそぶ', 'ක්‍රීඩා', NULL, 46, 'published', 1),
    (v_book_id, v_lesson_id, '調べる', 'しらべる', 'විමර්ශනය කරනවා', NULL, 47, 'published', 1),
    (v_book_id, v_lesson_id, '出発する', 'しゅっぱつする', 'පිටත් වීම', NULL, 48, 'published', 1),
    (v_book_id, v_lesson_id, '運転', 'うんてん', 'රිය පදනම', NULL, 49, 'published', 1),
    (v_book_id, v_lesson_id, '事故', 'じこ', 'අනතුර', NULL, 50, 'published', 1),
    (v_book_id, v_lesson_id, '故障', 'こしょう', 'බිඳීම/දෝෂය', NULL, 51, 'published', 1),
    (v_book_id, v_lesson_id, '指定席', 'していせき', 'වෙන්කළ ආසන', NULL, 52, 'published', 1),
    (v_book_id, v_lesson_id, '週末', 'しゅうまつ', 'සතිඅන්තය', NULL, 53, 'published', 1),
    (v_book_id, v_lesson_id, '絵', 'え', 'පින්තූරය', NULL, 54, 'published', 1),
    (v_book_id, v_lesson_id, '空', 'そら', 'අහස', NULL, 55, 'published', 1),
    (v_book_id, v_lesson_id, '泳ぐ', 'およぐ', 'පීනනවා', NULL, 56, 'published', 1),
    (v_book_id, v_lesson_id, '光る', 'ひかる', 'දිලිසෙනවා', NULL, 57, 'published', 1),
    (v_book_id, v_lesson_id, '到着する', 'とうちゃくする', 'ළඟා වීම', NULL, 58, 'published', 1),
    (v_book_id, v_lesson_id, 'お知らせ', 'おしらせ', 'දැනුම්දීම/නිවේදනය', NULL, 59, 'published', 1),
    (v_book_id, v_lesson_id, '今月', 'こんげつ', 'මේ මාසය', NULL, 60, 'published', 1),
    (v_book_id, v_lesson_id, '水道', 'すいどう', 'ජල සැපයුම', NULL, 61, 'published', 1),
    (v_book_id, v_lesson_id, '工事', 'こうじ', 'ඉදිකිරීම', NULL, 62, 'published', 1),
    (v_book_id, v_lesson_id, '広場', 'ひろば', 'පුලුල් ස්ථානය', NULL, 63, 'published', 1),
    (v_book_id, v_lesson_id, '場合', 'ばあい', 'අවස්ථාව', NULL, 64, 'published', 1),
    (v_book_id, v_lesson_id, '中止', 'ちゅうし', 'අත්හිටුවීම/රද්ද කිරීම', NULL, 65, 'published', 1),
    (v_book_id, v_lesson_id, '条件', 'じょうけん', 'කොන්දේසි', NULL, 66, 'published', 1),
    (v_book_id, v_lesson_id, '～以上', 'いじょう', 'වැඩි/ඉහළ', NULL, 67, 'published', 1),
    (v_book_id, v_lesson_id, '開く', 'ひらく', 'විවෘත කරනවා', NULL, 68, 'published', 1),
    (v_book_id, v_lesson_id, '生産する', 'せいさんする', 'නිෂ්පාදනය කරනවා', NULL, 69, 'published', 1),
    (v_book_id, v_lesson_id, '来年', 'らいねん', 'ලබන වසර', NULL, 70, 'published', 1),
    (v_book_id, v_lesson_id, '会場', 'かいじょう', 'රැස්වීම් ශාලාව', NULL, 71, 'published', 1),
    (v_book_id, v_lesson_id, '世界', 'せかい', 'ලෝකය', NULL, 72, 'published', 1),
    (v_book_id, v_lesson_id, '体験', 'たいけん', 'පුද්ගලික අත්දැකීම', NULL, 73, 'published', 1),
    (v_book_id, v_lesson_id, '国際交流', 'こくさいこうりゅう', 'ජාත්‍යන්තර හුවමාරුව', NULL, 74, 'published', 1),
    (v_book_id, v_lesson_id, '禁止', 'きんし', 'තහනම', NULL, 75, 'published', 1),
    (v_book_id, v_lesson_id, '紙', 'かみ', 'කඩදාසි', NULL, 76, 'published', 1),
    (v_book_id, v_lesson_id, '始まる', 'はじまる', 'ආරම්භ වීම', NULL, 77, 'published', 1),
    (v_book_id, v_lesson_id, '申し込む', 'もうしこむ', 'අයදුම් කරනවා', NULL, 78, 'published', 1),
    (v_book_id, v_lesson_id, '今年', 'ことし', 'මේ වසර', NULL, 79, 'published', 1),
    (v_book_id, v_lesson_id, '昨年', 'さくねん', 'පසුගිය වසර', NULL, 80, 'published', 1),
    (v_book_id, v_lesson_id, '毎年', 'まいとし', 'හැම වසරකම', NULL, 81, 'published', 1),
    (v_book_id, v_lesson_id, '文化', 'ぶんか', 'සංස්කෘතිය', NULL, 82, 'published', 1),
    (v_book_id, v_lesson_id, '祭り', 'まつり', 'උත්සවය', NULL, 83, 'published', 1),
    (v_book_id, v_lesson_id, '正月', 'しょうげつ', 'නව වසර', NULL, 84, 'published', 1),
    (v_book_id, v_lesson_id, '～式', 'しき', 'උත්සව/උත්සව මාර්ගය', NULL, 85, 'published', 1),
    (v_book_id, v_lesson_id, '大人', 'おとな', 'වැඩිහිටි', NULL, 86, 'published', 1),
    (v_book_id, v_lesson_id, '米', 'こめ', 'සහල්', NULL, 87, 'published', 1),
    (v_book_id, v_lesson_id, '特別な', 'とくべつな', 'විශේෂ', NULL, 88, 'published', 1),
    (v_book_id, v_lesson_id, '服', 'ふく', 'ඇදුම', NULL, 89, 'published', 1),
    (v_book_id, v_lesson_id, '袋', 'ふくろ', 'බෑගය/කඩදාසි ඇඳුම', NULL, 90, 'published', 1),
    (v_book_id, v_lesson_id, '自分', 'じぶん', 'තමන්', NULL, 91, 'published', 1),
    (v_book_id, v_lesson_id, '店長', 'てんちょう', 'කළමනාකරු', NULL, 92, 'published', 1),
    (v_book_id, v_lesson_id, '全員', 'ぜんいん', 'සියලු දෙනා', NULL, 93, 'published', 1),
    (v_book_id, v_lesson_id, '習慣', 'しゅうかん', 'පුරුද්ද', NULL, 94, 'published', 1),
    (v_book_id, v_lesson_id, '普通', 'ふつう', 'සාමාන්‍ය', NULL, 95, 'published', 1),
    (v_book_id, v_lesson_id, '暗い', 'くらい', 'අඳුරු', NULL, 96, 'published', 1),
    (v_book_id, v_lesson_id, '残る', 'のこる', 'ඉතිරි වීම', NULL, 97, 'published', 1),
    (v_book_id, v_lesson_id, '入院する', 'にゅういんする', 'රෝහල් ගත වීම', NULL, 98, 'published', 1),
    (v_book_id, v_lesson_id, '色', 'いろ', 'පාට', NULL, 99, 'published', 1),
    (v_book_id, v_lesson_id, '赤', 'あか', 'රතු', NULL, 100, 'published', 1),
    (v_book_id, v_lesson_id, '青', 'あお', 'නිල්', NULL, 101, 'published', 1),
    (v_book_id, v_lesson_id, '黒', 'くろ', 'කළු', NULL, 102, 'published', 1),
    (v_book_id, v_lesson_id, '白', 'しろ', 'සුදු', NULL, 103, 'published', 1),
    (v_book_id, v_lesson_id, '女性', 'じょせい', 'කාන්තාව', NULL, 104, 'published', 1),
    (v_book_id, v_lesson_id, '男性', 'だんせい', 'පිරිමි', NULL, 105, 'published', 1),
    (v_book_id, v_lesson_id, '急に', 'きゅうに', 'හදිසියෙන්', NULL, 106, 'published', 1),
    (v_book_id, v_lesson_id, '営業する', 'えいぎょうする', 'ව්‍යාපාර කරනවා', NULL, 107, 'published', 1),
    (v_book_id, v_lesson_id, '案内する', 'あんないする', 'මග පෙන්වීම', NULL, 108, 'published', 1),
    (v_book_id, v_lesson_id, '商品', 'しょうひん', 'භාණ්ඩ', NULL, 109, 'published', 1),
    (v_book_id, v_lesson_id, '値段', 'ねだん', 'මිල', NULL, 110, 'published', 1),
    (v_book_id, v_lesson_id, '価格', 'かかく', 'මිල/වටිනාකම', NULL, 111, 'published', 1),
    (v_book_id, v_lesson_id, '消費税', 'しょうひぜい', 'පාරිභෝගික බදු', NULL, 112, 'published', 1),
    (v_book_id, v_lesson_id, '税別', 'ぜいべつ', 'බදු වෙන වෙනම', NULL, 113, 'published', 1),
    (v_book_id, v_lesson_id, '店員', 'てんいん', 'සාප්පු සේවකයා', NULL, 114, 'published', 1),
    (v_book_id, v_lesson_id, '親切な', 'しんせつな', 'කරුණාවන්ත', NULL, 115, 'published', 1),
    (v_book_id, v_lesson_id, '重い', 'おもい', 'බර', NULL, 116, 'published', 1),
    (v_book_id, v_lesson_id, '軽い', 'かるい', 'සැහැල්ලු', NULL, 117, 'published', 1),
    (v_book_id, v_lesson_id, '変わる', 'かわる', 'වෙනස් වීම', NULL, 118, 'published', 1),
    (v_book_id, v_lesson_id, '市', 'し', 'නගරය', NULL, 119, 'published', 1),
    (v_book_id, v_lesson_id, '料金', 'りょうきん', 'ගාස්තුව', NULL, 120, 'published', 1),
    (v_book_id, v_lesson_id, '図書館', 'としょかん', 'පුස්තකාලය', NULL, 121, 'published', 1),
    (v_book_id, v_lesson_id, '道具', 'どうぐ', 'උපකරණ', NULL, 122, 'published', 1),
    (v_book_id, v_lesson_id, '～点', 'てん', 'ලකුණු', NULL, 123, 'published', 1),
    (v_book_id, v_lesson_id, '必要な', 'ひつような', 'අවශ්‍ය', NULL, 124, 'published', 1),
    (v_book_id, v_lesson_id, '借りる', 'かりる', 'ණයට ගැනීම', NULL, 125, 'published', 1),
    (v_book_id, v_lesson_id, '返す', 'かえす', 'ආපසු දීම', NULL, 126, 'published', 1),
    (v_book_id, v_lesson_id, '開く', 'あく', '(දොර) විවෘත වීම', NULL, 127, 'published', 1),
    (v_book_id, v_lesson_id, '閉まる', 'しまる', '(දොර) වැසීම', NULL, 128, 'published', 1),
    (v_book_id, v_lesson_id, '利用する', 'りようする', 'භාවිතා කිරීම', NULL, 129, 'published', 1),
    (v_book_id, v_lesson_id, '外国', 'がいこく', 'විදේශ රට', NULL, 130, 'published', 1),
    (v_book_id, v_lesson_id, '情報', 'じょうほう', 'තොරතුරු', NULL, 131, 'published', 1),
    (v_book_id, v_lesson_id, '相談', 'そうだん', 'සාකච්ඡා කිරීම', NULL, 132, 'published', 1),
    (v_book_id, v_lesson_id, '質問', 'しつもん', 'ප්‍රශ්නය', NULL, 133, 'published', 1),
    (v_book_id, v_lesson_id, '窓口', 'まどぐち', 'කවුළුව/සේවා කවුළුව', NULL, 134, 'published', 1),
    (v_book_id, v_lesson_id, '郵便局', 'ゆうびんきょく', 'තැපැල් කාර්යාලය', NULL, 135, 'published', 1),
    (v_book_id, v_lesson_id, '近所', 'きんじょ', 'අසල්වැසි', NULL, 136, 'published', 1),
    (v_book_id, v_lesson_id, '自動', 'じどう', 'ස්වයංක්‍රීය/automatic', NULL, 137, 'published', 1),
    (v_book_id, v_lesson_id, '洗う', 'あらう', 'සේදීම', NULL, 138, 'published', 1),
    (v_book_id, v_lesson_id, '入力する', 'にゅうりょくする', 'දත්ත ඇතුළු කිරීම', NULL, 139, 'published', 1),
    (v_book_id, v_lesson_id, '温度', 'おんど', 'උෂ්ණත්වය', NULL, 140, 'published', 1),
    (v_book_id, v_lesson_id, '危険', 'きけん', 'භයානක', NULL, 141, 'published', 1),
    (v_book_id, v_lesson_id, '～種類', 'しゅるい', 'වර්ගය/ප්‍රභේදය', NULL, 142, 'published', 1),
    (v_book_id, v_lesson_id, '消す', 'けす', 'මකා දමනවා', NULL, 143, 'published', 1),
    (v_book_id, v_lesson_id, '捨てる', 'すてる', 'ඉවත දමනවා', NULL, 144, 'published', 1),
    (v_book_id, v_lesson_id, '出す', 'だす', 'ඉවත් කිරීම/යැවීම', NULL, 145, 'published', 1),
    (v_book_id, v_lesson_id, '分ける', 'わける', 'බෙදා ගැනීම/වර්ගීකරණය', NULL, 146, 'published', 1),
    (v_book_id, v_lesson_id, '燃える', 'もえる', 'දහන', NULL, 147, 'published', 1),
    (v_book_id, v_lesson_id, '決める', 'きめる', 'තීරණය කිරීම', NULL, 148, 'published', 1),
    (v_book_id, v_lesson_id, '設定する', 'せっていする', 'පිහිටුවීම', NULL, 149, 'published', 1),
    (v_book_id, v_lesson_id, '地震', 'じしん', 'භූමිකම්පාව', NULL, 150, 'published', 1),
    (v_book_id, v_lesson_id, '台風', 'たいふう', 'සුළි කුණාටුව', NULL, 151, 'published', 1),
    (v_book_id, v_lesson_id, '外', 'そと', 'පිටත', NULL, 152, 'published', 1),
    (v_book_id, v_lesson_id, '声', 'こえ', 'හඬ/කටහඬ', NULL, 153, 'published', 1),
    (v_book_id, v_lesson_id, '危ない', 'あぶない', 'භයානක', NULL, 154, 'published', 1),
    (v_book_id, v_lesson_id, '大切な', 'たいせつな', 'වැදගත්', NULL, 155, 'published', 1),
    (v_book_id, v_lesson_id, '心配な', 'しんぱいな', 'කනගාටුදායක', NULL, 156, 'published', 1),
    (v_book_id, v_lesson_id, '集まる', 'あつまる', 'එකතු වීම/රැස් වීම', NULL, 157, 'published', 1),
    (v_book_id, v_lesson_id, '進む', 'すすむ', 'ඉදිරියට යාම/වැඩිදියුණු වීම', NULL, 158, 'published', 1),
    (v_book_id, v_lesson_id, '最近', 'さいきん', 'මෑතකදී', NULL, 159, 'published', 1),
    (v_book_id, v_lesson_id, '授業', 'じゅぎょう', 'පාඩම', NULL, 160, 'published', 1),
    (v_book_id, v_lesson_id, '問題', 'もんだい', 'ගැටලුව', NULL, 161, 'published', 1),
    (v_book_id, v_lesson_id, '大変な', 'たいへんな', 'අමාරු', NULL, 162, 'published', 1),
    (v_book_id, v_lesson_id, '困る', 'こまる', 'කරදරයට පත් වීම', NULL, 163, 'published', 1),
    (v_book_id, v_lesson_id, '違う', 'ちがう', 'වෙනස් වීම', NULL, 164, 'published', 1),
    (v_book_id, v_lesson_id, '慣れる', 'なれる', 'හුරු වීම', NULL, 165, 'published', 1),
    (v_book_id, v_lesson_id, '増える', 'ふえる', 'වැඩි වීම', NULL, 166, 'published', 1),
    (v_book_id, v_lesson_id, '笑う', 'わらう', 'සිනහව', NULL, 167, 'published', 1),
    (v_book_id, v_lesson_id, '苦労する', 'くろうする', 'දුෂ්කරතාවට මුහුණ දීම', NULL, 168, 'published', 1),
    (v_book_id, v_lesson_id, '希望', 'きぼう', 'අපේක්ෂාව', NULL, 169, 'published', 1),
    (v_book_id, v_lesson_id, '募集', 'ぼしゅう', 'අයදුම් කිරීම/බඳවා ගැනීම', NULL, 170, 'published', 1),
    (v_book_id, v_lesson_id, '特に', 'とくに', 'විශේෂයෙන්', NULL, 171, 'published', 1),
    (v_book_id, v_lesson_id, '住む', 'すむ', 'ජීවත් වීම', NULL, 172, 'published', 1),
    (v_book_id, v_lesson_id, '建てる', 'たてる', 'ගොඩනැගීම', NULL, 173, 'published', 1),
    (v_book_id, v_lesson_id, '続ける', 'つづける', 'දිගටම කරගෙන යාම', NULL, 174, 'published', 1),
    (v_book_id, v_lesson_id, '考える', 'かんがえる', 'සිතීම/කල්පනා කිරීම', NULL, 175, 'published', 1),
    (v_book_id, v_lesson_id, '役に立つ', 'やくにたつ', 'ප්‍රයෝජනවත් වීම', NULL, 176, 'published', 1),
    (v_book_id, v_lesson_id, '卒業する', 'そつぎょうする', 'උපාධිය ලබා ගැනීම/අවසන් කිරීම', NULL, 177, 'published', 1),
    (v_book_id, v_lesson_id, '留学する', 'りゅうがくする', 'විදේශ අධ්‍යාපනය කිරීම', NULL, 178, 'published', 1);

  INSERT INTO public.kanji_games (
    collection_id, game_key, title, title_si, description,
    intro_enabled, intro_youtube_url, summary, is_enabled, sort_order
  ) VALUES
  (
    v_book_id, 'flash_card', 'Flash Card', 'Flash Card',
    'Practice Book 3 Kanji using interactive flash cards.',
    false, NULL,
    'මෙම game එක මඟින් Book 3 හි Kanji හඳුනාගැනීම සහ ඒවාට අදාළ වචන මතක තබාගැනීම පුහුණු කළ හැක.',
    true, 1
  ),
  (
    v_book_id, 'choose_correct', 'හරියට තෝරන්න', 'හරියට තෝරන්න',
    'Choose the correct answer for Book 3 Kanji.',
    false, NULL,
    'මෙම game එකෙන් Book 3 Kanji සඳහා නිවැරදි ජපන් වචනය සහ සිංහල අර්ථය තෝරා ගැනීම පුහුණු වේ.',
    true, 2
  )
  ON CONFLICT (collection_id, game_key) DO NOTHING;

END $$;
