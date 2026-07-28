// sampleCollections.ts - Malaysia SJKC/SK Primary School KSSR spelling vocabulary
import { KnowledgeCollection } from '../types';

export const SAMPLE_COLLECTIONS: KnowledgeCollection[] = [
  // ============================================================
  // GROUP 1: English (Bahasa Inggeris SJKC/SK)
  // ============================================================
  {
    id: 'col-eng-01',
    name: 'Primary School English (KSSR)',
    description: 'Standard Year 1-6 English spelling vocabulary and common terms used in Malaysia primary schools (KSSR).',
    group: 'English',
    difficulty: 'Year 2',
    tags: ['Listening'],
    version: 1,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    questionCount: 12,
    categories: ['Listening'],
    questions: [
      {
        id: 'eng-q1',
        category: 'Listening',
        questionText: 'Listen',
        options: ['Listen', 'Lixten', 'Lexten', 'Listin'],
        correctIndex: 0,
        explanation: '听（Listen）。例句：I listen to music every day.（我每天听音乐。）',
        sourceReference: 'English Year 2 Textbook, Unit 1'
      },
      {
        id: 'eng-q2',
        category: 'Listening',
        questionText: 'Butterfly',
        options: ['Butterflee', 'Butterfly', 'Butterflai', 'Butterflie'],
        correctIndex: 1,
        explanation: '蝴蝶（Butterfly）。例句：The butterfly has colourful wings.（蝴蝶有绚丽彩色的翅膀。）',
        sourceReference: 'English Year 2 Textbook, Unit 5'
      },
      {
        id: 'eng-q3',
        category: 'Listening',
        questionText: 'Library',
        options: ['Libary', 'Librari', 'Library', 'Lybrary'],
        correctIndex: 2,
        explanation: '图书馆（Library）。例句：We read books in the library.（我们在图书馆里看书。）',
        sourceReference: 'English Year 3 Textbook, Unit 1'
      },
      {
        id: 'eng-q4',
        category: 'Listening',
        questionText: 'Classroom',
        options: ['Classroom', 'Clasroom', 'Classrom', 'Klasroom'],
        correctIndex: 0,
        explanation: '教室/课室（Classroom）。例句：The pupils sit quietly in the classroom.（学生们安静地坐在课室里。）',
        sourceReference: 'English Year 1 Textbook, Unit 1'
      },
      {
        id: 'eng-q5',
        category: 'Listening',
        questionText: 'Sandwich',
        options: ['Sanwich', 'Sandwich', 'Sandwichs', 'Sendwich'],
        correctIndex: 1,
        explanation: '三明治/三文治（Sandwich）。例句：Mother made an egg sandwich for breakfast.（妈妈早餐做了一个鸡蛋三明治。）',
        sourceReference: 'English Year 2 Textbook, Unit 6'
      },
      {
        id: 'eng-q6',
        category: 'Listening',
        questionText: 'Pineapple',
        options: ['Pineaple', 'Pinaple', 'Pineapple', 'Pyneapple'],
        correctIndex: 2,
        explanation: '黄梨/菠萝（Pineapple）。例句：Pineapple is a sweet tropical fruit.（黄梨是一种甜美的热带水果。）',
        sourceReference: 'English Year 2 Textbook, Unit 6'
      },
      {
        id: 'eng-q7',
        category: 'Listening',
        questionText: 'Hospital',
        options: ['Hospitel', 'Hospital', 'Hospitall', 'Haspital'],
        correctIndex: 1,
        explanation: '医院（Hospital）。例句：The doctor works in a hospital.（医生在医院里工作。）',
        sourceReference: 'English Year 4 Textbook, Unit 3'
      },
      {
        id: 'eng-q8',
        category: 'Listening',
        questionText: 'Calculator',
        options: ['Calculater', 'Calculator', 'Calkulator', 'Calculaterr'],
        correctIndex: 1,
        explanation: '计算器（Calculator）。例句：He uses a calculator for maths homework.（他用计算器做数学作业。）',
        sourceReference: 'English Year 5 Textbook, Unit 2'
      },
      {
        id: 'eng-q9',
        category: 'Listening',
        questionText: 'Calendar',
        options: ['Calender', 'Calendar', 'Kalendar', 'Calandar'],
        correctIndex: 1,
        explanation: '日历（Calendar）。例句：I mark my birthday on the calendar.（我在日历上圈出我的生日。）',
        sourceReference: 'English Year 3 Textbook, Unit 2'
      },
      {
        id: 'eng-q10',
        category: 'Listening',
        questionText: 'Umbrella',
        options: ['Umbrela', 'Umbrella', 'Ambrella', 'Umberella'],
        correctIndex: 1,
        explanation: '雨伞（Umbrella）。例句：Take an umbrella when it rains.（下雨时请带上一把伞。）',
        sourceReference: 'English Year 1 Textbook, Unit 4'
      },
      {
        id: 'eng-q11',
        category: 'Listening',
        questionText: 'Playground',
        options: ['Playgrownd', 'Playgrond', 'Playground', 'Pleyground'],
        correctIndex: 2,
        explanation: '游乐场/操场（Playground）。例句：Children love playing at the playground.（孩子们喜欢在游乐场玩耍。）',
        sourceReference: 'English Year 1 Textbook, Unit 3'
      },
      {
        id: 'eng-q12',
        category: 'Listening',
        questionText: 'Vegetable',
        options: ['Vegtable', 'Vegetable', 'Vegetabel', 'Vegeable'],
        correctIndex: 1,
        explanation: '蔬菜（Vegetable）。例句：Eating fresh vegetable is good for health.（多吃新鲜蔬菜有益健康。）',
        sourceReference: 'English Year 2 Textbook, Unit 7'
      }
    ]
  },

  // ============================================================
  // GROUP 2: 华文 (Bahasa Cina SJKC)
  // ============================================================
  {
    id: 'col-chi-01',
    name: '华小华文词汇 (KSSR)',
    description: '适用于马来西亚华文小学 (SJKC) 常用核心词汇汉字与汉语拼音拼写练习。',
    group: '华文',
    difficulty: 'Year 1',
    tags: ['听写'],
    version: 1,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    questionCount: 12,
    categories: ['听写'],
    questions: [
      {
        id: 'chi-q1',
        category: '听写',
        questionText: '学校',
        options: ['学校', '学效', '学较', '学郊'],
        correctIndex: 0,
        explanation: '学校（School）。意思：学生求学读书的场所。例句：我们在学校里认真学习。（We study hard at school.）',
        sourceReference: '华小二年级 华文课本 第一单元'
      },
      {
        id: 'chi-q2',
        category: '听写',
        questionText: '操场',
        options: ['燥场', '操场', '澡场', '躁场'],
        correctIndex: 1,
        explanation: '操场（Field/Playground）。意思：供体育锻炼或集会的场地。例句：同学们在操场上踢足球。（Students are playing football on the field.）',
        sourceReference: '华小一年级 华文课本 第三单元'
      },
      {
        id: 'chi-q3',
        category: '听写',
        questionText: '图书',
        options: ['图画', '图胜', '图书', '图章'],
        correctIndex: 2,
        explanation: '图书（Books）。意思：书籍与图册。例句：我喜欢在图书馆借阅图书。（I like borrowing books at the library.）',
        sourceReference: '华小一年级 华文课本 第二单元'
      },
      {
        id: 'chi-q4',
        category: '听写',
        questionText: '老师',
        options: ['老狮', '老师', '老实', '老事'],
        correctIndex: 1,
        explanation: '老师（Teacher）。意思：教书育人的教师。例句：老师耐心地解答我们的问题。（The teacher patiently answered our questions.）',
        sourceReference: '华小一年级 华文课本 第一单元'
      },
      {
        id: 'chi-q5',
        category: '听写',
        questionText: '马路',
        options: ['马陆', '马鹿', '马路', '马录'],
        correctIndex: 2,
        explanation: '马路（Road/Street）。意思：供车辆和行人通行的道路。例句：过马路时要注意安全。（Pay attention to safety when crossing the road.）',
        sourceReference: '华小二年级 华文课本 第五单元'
      },
      {
        id: 'chi-q6',
        category: '听写',
        questionText: '风筝',
        options: ['风筝', '风争', '风挣', '风峥'],
        correctIndex: 0,
        explanation: '风筝（Kite）。意思：靠风力扬升的纸鸢玩具。例句：晴朗的周末，我们在公园放风筝。（We fly kites in the park on sunny weekends.）',
        sourceReference: '华小三年级 华文课本 第八单元'
      },
      {
        id: 'chi-q7',
        category: '听写',
        questionText: '小鸟',
        options: ['小乌', '小鸟', '小岛', '小袅'],
        correctIndex: 1,
        explanation: '小鸟（Bird）。意思：飞禽动物。例句：树枝上有几只小鸟在欢快地唱歌。（There are a few birds singing merrily on the tree branch.）',
        sourceReference: '华小一年级 华文课本 第四单元'
      },
      {
        id: 'chi-q8',
        category: '听写',
        questionText: '太阳',
        options: ['大阳', '太阳', '太扬', '太羊'],
        correctIndex: 1,
        explanation: '太阳（Sun）。意思：白天的发光恒星。例句：早晨的太阳从东方缓缓升起。（The morning sun gently rises in the east.）',
        sourceReference: '华小二年级 华文课本 第三单元'
      },
      {
        id: 'chi-q9',
        category: '听写',
        questionText: '快乐',
        options: ['快乐', '快勒', '快肋', '快拉'],
        correctIndex: 0,
        explanation: '快乐（Happy/Joyful）。意思：心情感到愉悦欢畅。例句：祝你生日快乐，学习进步！（Wish you a happy birthday and great progress in study!）',
        sourceReference: '华小一年级 华文课本 第六单元'
      },
      {
        id: 'chi-q10',
        category: '听写',
        questionText: '勇敢',
        options: ['勇感', '涌敢', '勇敢', '俑敢'],
        correctIndex: 2,
        explanation: '勇敢（Brave/Courageous）。意思：不怕困难和危险。例句：他十分勇敢，不怕面对任何挑战。（He is very brave and not afraid of any challenge.）',
        sourceReference: '华小三年级 华文课本 第十二单元'
      },
      {
        id: 'chi-q11',
        category: '听写',
        questionText: '温和',
        options: ['温和', '温合', '温河', '温荷'],
        correctIndex: 0,
        explanation: '温和（Gentle/Mild）。意思：态度或气温亲切和煦。例句：张老师性格温和，深受学生喜爱。（Teacher Zhang has a gentle personality and is loved by students.）',
        sourceReference: '华小三年级 华文课本 第九单元'
      },
      {
        id: 'chi-q12',
        category: '听写',
        questionText: '帮助',
        options: ['帮主', '帮助', '帮柱', '帮住'],
        correctIndex: 1,
        explanation: '帮助（Help/Assist）。意思：给他人提供支援或协助。例句：我们应该经常帮助有困难的同学。（We should often help classmates in need.）',
        sourceReference: '华小二年级 华文课本 第十单元'
      }
    ]
  },

  // ============================================================
  // GROUP 3: Bahasa Melayu (Malay SK/SJKC)
  // ============================================================
  {
    id: 'col-ms-01',
    name: 'Kosa Kata Bahasa Melayu',
    description: 'Latihan ejaan dan sebutan kosa kata Bahasa Melayu Sekolah Rendah (SK & SJKC) yang selaras dengan sukatan pelajaran KSSR.',
    group: 'Malay',
    difficulty: 'Year 1',
    tags: ['Mendengar'],
    version: 1,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    questionCount: 12,
    categories: ['Mendengar'],
    questions: [
      {
        id: 'ms-q1',
        category: 'Mendengar',
        questionText: 'sekolah',
        options: ['sekolah', 'sekola', 'sekolat', 'syekolah'],
        correctIndex: 0,
        explanation: '学校（School / Sekolah）。Maksud: Tempat untuk belajar. 例句：Saya pergi ke sekolah setiap hari.（我每天去上学。）',
        sourceReference: 'Buku Teks BM Tahun 1, Unit 2'
      },
      {
        id: 'ms-q2',
        category: 'Mendengar',
        questionText: 'perpustakaan',
        options: ['prepustakaan', 'perpustakan', 'perpustakaan', 'perpustakkaan'],
        correctIndex: 2,
        explanation: '图书馆（Library / Perpustakaan）。Maksud: Tempat membaca dan meminjam buku. 例句：Murid-murid membaca buku di perpustakaan.（同学们在图书馆看书。）',
        sourceReference: 'Buku Teks BM Tahun 3, Unit 4'
      },
      {
        id: 'ms-q3',
        category: 'Mendengar',
        questionText: 'bendera',
        options: ['bandera', 'bendera', 'benderra', 'bendeira'],
        correctIndex: 1,
        explanation: '国旗/旗帜（Flag / Bendera）。Maksud: Lambang kebangsaan. 例句：Jalur Gemilang ialah bendera Malaysia.（辉煌条纹是马来西亚国旗。）',
        sourceReference: 'Buku Teks BM Tahun 2, Unit 12'
      },
      {
        id: 'ms-q4',
        category: 'Mendengar',
        questionText: 'guru',
        options: ['geru', 'guru', 'guro', 'ghuru'],
        correctIndex: 1,
        explanation: '教师/老师（Teacher / Guru）。Maksud: Pendidik di sekolah. 例句：Cikgu Tan ialah guru Bahasa Melayu kami.（陈老师是我们的国文老师。）',
        sourceReference: 'Buku Teks BM Tahun 1, Unit 1'
      },
      {
        id: 'ms-q5',
        category: 'Mendengar',
        questionText: 'murid',
        options: ['mured', 'murid', 'murd', 'mureed'],
        correctIndex: 1,
        explanation: '学生（Student / Pupil / Murid）。Maksud: Kanak-kanak yang belajar di sekolah. 例句：Murid-murid mendengar arahan guru.（学生们认真听老师讲课。）',
        sourceReference: 'Buku Teks BM Tahun 1, Unit 1'
      },
      {
        id: 'ms-q6',
        category: 'Mendengar',
        questionText: 'padang',
        options: ['padang', 'padangg', 'pedang', 'padangh'],
        correctIndex: 0,
        explanation: '草场/操场（Field / Padang）。Maksud: Kawasan tanah lapang untuk bersukan. 例句：Kami bermain bola sepak di padang sekolah.（我们在学校草场踢足球。）',
        sourceReference: 'Buku Teks BM Tahun 1, Unit 3'
      },
      {
        id: 'ms-q7',
        category: 'Mendengar',
        questionText: 'sarapan',
        options: ['sarpan', 'serapan', 'sarapan', 'sarapann'],
        correctIndex: 2,
        explanation: '早餐（Breakfast / Sarapan）。Maksud: Makanan waktu pagi. 例句：Ibu menyediakan roti bakar untuk sarapan.（妈妈准备烤面包做早餐。）',
        sourceReference: 'Buku Teks BM Tahun 2, Unit 5'
      },
      {
        id: 'ms-q8',
        category: 'Mendengar',
        questionText: 'kesihatan',
        options: ['kasihatan', 'kesihatan', 'kesehatan', 'kesihatann'],
        correctIndex: 1,
        explanation: '健康（Health / Kesihatan）。Maksud: Keadaan badan yang sihat. 例句：Makanan seimbang penting untuk kesihatan.（均衡的饮食对健康非常重要。）',
        sourceReference: 'Buku Teks BM Tahun 4, Unit 8'
      },
      {
        id: 'ms-q9',
        category: 'Mendengar',
        questionText: 'motosikal',
        options: ['mototsikal', 'motosikal', 'motorsikal', 'motesikal'],
        correctIndex: 1,
        explanation: '摩托车（Motorcycle / Motosikal）。Maksud: Kenderaan berenjin roda dua. 例句：Bapa menunggang motosikal ke tempat kerja.（爸爸骑摩托车去上班。）',
        sourceReference: 'Buku Teks BM Tahun 3, Unit 15'
      },
      {
        id: 'ms-q10',
        category: 'Mendengar',
        questionText: 'basikal',
        options: ['basikal', 'basikell', 'besikal', 'bacikal'],
        correctIndex: 0,
        explanation: '自行车/脚踏车（Bicycle / Basikal）。Maksud: Kenderaan dua roda yang dikayuh. 例句：Ahmad menunggang basikal ke sekolah.（阿末骑脚踏车去上学。）',
        sourceReference: 'Buku Teks BM Tahun 1, Unit 10'
      },
      {
        id: 'ms-q11',
        category: 'Mendengar',
        questionText: 'kamus',
        options: ['kamus', 'kamous', 'kames', 'khamus'],
        correctIndex: 0,
        explanation: '词典/字典（Dictionary / Kamus）。Maksud: Buku rujukan maksud perkataan. 例句：Saya menggunakan kamus untuk mencari maksud perkataan.（我用字典查找生词的意思。）',
        sourceReference: 'Buku Teks BM Tahun 5, Unit 1'
      },
      {
        id: 'ms-q12',
        category: 'Mendengar',
        questionText: 'kerjasama',
        options: ['kerja sama', 'kerjasama', 'kerjasamma', 'kerjesama'],
        correctIndex: 1,
        explanation: '合作（Cooperation / Kerjasama）。Maksud: Bekerja bersama-sama. 例句：Kerjasama antara jiran mengeratkan hubungan.（邻居之间的合作增进了感情。）',
        sourceReference: 'Buku Teks BM Tahun 2, Unit 3'
      }
    ]
  }
];
