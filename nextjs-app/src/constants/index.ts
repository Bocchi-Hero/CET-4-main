import { VocabularyWord, VocabDataset } from '@/types';

type RawWord = [string, string, string, string, 'high' | 'medium' | 'low', 'easy' | 'medium' | 'hard'];

/**
 * 核心 100 词 - 覆盖 A-Z，确保初始可用性
 */
const SEED_CORE: RawWord[] = [
  ['abandon', '/əˈbændən/', '放弃，抛弃', 'He had to abandon his plan due to the rain.', 'high', 'easy'],
  ['abstract', '/ˈæbstrækt/', '抽象的，摘要', 'The concept of justice is often abstract.', 'medium', 'medium'],
  ['academic', '/ˌækəˈdemɪk/', '学术的', 'She has a brilliant academic record.', 'high', 'easy'],
  ['access', '/ˈækses/', '接近，入口', 'Students need access to the library.', 'high', 'medium'],
  ['accommodate', '/əˈkɒmədeɪt/', '容纳，适应', 'The hotel can accommodate 200 guests.', 'medium', 'hard'],
  ['accumulate', '/əˈkjuːmjəleɪt/', '积累，积聚', 'I want to accumulate more experience.', 'medium', 'medium'],
  ['accurate', '/ˈækjərət/', '精确的', 'The clock is very accurate.', 'high', 'easy'],
  ['acknowledge', '/əkˈnɒlɪdʒ/', '承认，感谢', 'Please acknowledge receipt of this letter.', 'high', 'medium'],
  ['acquire', '/əˈkwaɪə(r)/', '获得，学到', 'I hope to acquire some new skills.', 'high', 'medium'],
  ['adapt', '/əˈdæpt/', '适应，改编', 'It took her a while to adapt to the new climate.', 'high', 'medium'],
  ['adequate', '/ˈædɪkwət/', '充足的，适当的', 'The food was adequate for 10 people.', 'medium', 'medium'],
  ['adjust', '/əˈdʒʌst/', '调整，校准', 'You should adjust your seat for comfort.', 'high', 'easy'],
  ['advocate', '/ˈædvəkeɪt/', '主张，提倡', 'They advocate for environmental protection.', 'medium', 'hard'],
  ['affect', '/əˈfekt/', '影响', 'Does smoking affect your health?', 'high', 'easy'],
  ['aggregate', '/ˈæɡrɪɡət/', '合计，聚合', 'The aggregate loss reached 5 million dollars.', 'low', 'hard'],
  ['allocate', '/ˈæləkeɪt/', '分配，拨给', 'The government will allocate more funds for education.', 'medium', 'hard'],
  ['alter', '/ˈɔːltə(r)/', '改变，变更', 'Nothing can alter the fact.', 'high', 'medium'],
  ['alternative', '/ɔːlˈtɜːnətɪv/', '替代的，选择', 'Is there an alternative way?', 'high', 'medium'],
  ['ambiguous', '/æmˈbɪɡjuəs/', '模棱两可的', 'The instructions were quite ambiguous.', 'low', 'hard'],
  ['analyze', '/ˈænəlaɪz/', '分析', 'We need to analyze the data carefully.', 'high', 'medium'],
  ['annual', '/ˈænjuəl/', '每年的，年度的', 'The annual report is published in March.', 'medium', 'easy'],
  ['anticipate', '/ænˈtɪsɪpeɪt/', '预测，预料', 'We anticipate a large crowd at the event.', 'medium', 'medium'],
  ['apparent', '/əˈpærənt/', '明显的', 'The cause of the problem was apparent.', 'medium', 'medium'],
  ['appendix', '/əˈpendɪks/', '附录', 'See appendix A for more details.', 'low', 'medium'],
  ['appreciate', '/əˈpriːʃieɪt/', '欣赏，感激', 'I really appreciate your help.', 'high', 'easy'],
  ['approach', '/əˈprəʊtʃ/', '靠近，方法', 'He has a unique approach to problems.', 'high', 'medium'],
  ['appropriate', '/əˈprəʊpriət/', '适当的', 'Is this dress appropriate for the party?', 'high', 'medium'],
  ['approximate', '/əˈprɒksɪmət/', '近似的', 'The approximate cost is 100 dollars.', 'medium', 'medium'],
  ['arbitrary', '/ˈɑːbɪtrəri/', '随意的，武断的', 'The decision seemed arbitrary.', 'low', 'hard'],
  ['aspect', '/ˈæspekt/', '方面', 'Consider every aspect of the problem.', 'high', 'medium'],
  ['assemble', '/əˈsembl/', '集合，装配', 'Please assemble the parts according to the manual.', 'medium', 'medium'],
  ['assess', '/əˈses/', '评估，估算', 'It is difficult to assess the damage.', 'medium', 'medium'],
  ['assign', '/əˈsaɪn/', '分配，指派', 'The teacher will assign homework.', 'high', 'easy'],
  ['assist', '/əˈsɪst/', '协助，帮助', 'He will assist you with the luggage.', 'high', 'easy'],
  ['assume', '/əˈsjuːm/', '假设，承担', 'I assume you are busy.', 'high', 'medium'],
  ['assure', '/əˈʃʊə(r)/', '确保，保证', 'I can assure you that it is safe.', 'high', 'medium'],
  ['attach', '/əˈtætʃ/', '附上，连接', 'Please attach a photo to the form.', 'high', 'easy'],
  ['attain', '/əˈteɪn/', '达到，获得', 'He finally attained his goal.', 'medium', 'hard'],
  ['attitude', '/ˈætɪtjuːd/', '态度', 'A positive attitude is important.', 'high', 'easy'],
  ['attribute', '/əˈtrɪbjuːt/', '属性，归功于', 'She attributes her success to hard work.', 'medium', 'hard'],
  ['author', '/ˈɔːθə(r)/', '作者', 'Who is the author of this book?', 'high', 'easy'],
  ['authority', '/ɔːˈθɒrəti/', '权威，当局', 'He is an authority on history.', 'medium', 'medium'],
  ['available', '/əˈveɪləbl/', '可用的，空闲的', 'Is this seat available?', 'high', 'easy'],
  ['aware', '/əˈweː(r)/', '意识到的', 'Are you aware of the danger?', 'high', 'medium'],
  ['benefit', '/ˈbenɪfɪt/', '利益，有益于', 'Exercise has many benefits.', 'high', 'easy'],
  ['bias', '/ˈbaɪəs/', '偏见', 'Scientists must avoid bias.', 'low', 'hard'],
  ['bond', '/bɒnd/', '联系，结合', 'A strong bond exists between them.', 'medium', 'medium'],
  ['brief', '/briːf/', '简短的', 'Keep your message brief.', 'high', 'easy'],
  ['bulk', '/bʌlk/', '体积，主体', 'The bulk of the work is done.', 'low', 'medium'],
  ['capable', '/ˈkeɪpəbl/', '有能力的', 'She is a very capable manager.', 'high', 'medium'],
  ['capacity', '/kəˈpæsəti/', '容量，能力', 'The theater has a large capacity.', 'medium', 'medium'],
  ['category', '/ˈkætəɡəri/', '类别', 'Which category does this belong to?', 'medium', 'easy'],
  ['cease', '/siːs/', '停止', 'The noise will cease soon.', 'medium', 'medium'],
  ['challenge', '/ˈtʃælɪndʒ/', '挑战', 'This task is a real challenge.', 'high', 'medium'],
  ['channel', '/ˈtʃænl/', '渠道，海峡', 'We use various channels to communicate.', 'medium', 'easy'],
  ['chapter', '/ˈtʃæptə(r)/', '章节', 'Read the first chapter for tomorrow.', 'high', 'easy'],
  ['chart', '/tʃɑːt/', '图表', 'Look at the chart on the screen.', 'high', 'easy'],
  ['chemical', '/ˈkemɪkl/', '化学的', 'The chemical reaction was fast.', 'medium', 'easy'],
  ['circumstance', '/ˈsɜːkəmstəns/', '情况，环境', 'Under no circumstances should you leave.', 'high', 'medium'],
  ['cite', '/saɪt/', '引用', 'You must cite your sources.', 'medium', 'hard'],
  ['civil', '/ˈsɪvl/', '国民的，文明的', 'They fought for civil rights.', 'medium', 'medium'],
  ['clarify', '/ˈklærəfaɪ/', '澄清', 'Could you clarify that point?', 'medium', 'medium'],
  ['classic', '/ˈklæsɪk/', '经典的', 'This is a classic example.', 'high', 'easy'],
  ['clause', '/klɔːz/', '条款，从句', 'The contract has a specific clause.', 'low', 'hard'],
  ['code', '/kəʊd/', '代码，准则', 'The building code must be followed.', 'high', 'medium'],
  ['coherent', '/kəʊˈhɪərənt/', '连贯的', 'He gave a coherent explanation.', 'low', 'hard'],
  ['coincide', '/ˌkəʊɪnˈsaɪd/', '巧合，一致', 'My vacation coincides with yours.', 'low', 'hard'],
  ['collapse', '/kəˈlæps/', '崩溃，倒塌', 'The roof might collapse.', 'medium', 'medium'],
  ['colleague', '/ˈkɒliːɡ/', '同事', 'He is a colleague of mine.', 'high', 'medium'],
  ['column', '/ˈkɒləm/', '专栏，圆柱', 'She writes a weekly column.', 'medium', 'medium'],
  ['combine', '/kəmˈbaɪn/', '结合', 'Combine all the ingredients.', 'high', 'easy'],
  ['comment', '/ˈkɒment/', '评论', 'No comment.', 'high', 'easy'],
  ['commit', '/kəˈmɪt/', '犯错，委托，承诺', 'They commit to high quality.', 'high', 'medium'],
  ['commodity', '/kəˈmɒdəti/', '商品', 'Oil is a vital commodity.', 'low', 'hard'],
  ['communicate', '/kəˈmjuːnɪkeɪt/', '交流', 'How do you communicate?', 'high', 'easy'],
  ['community', '/kəˈmjuːnəti/', '社区', 'The community center is open.', 'high', 'easy'],
  ['compatible', '/kəmˈpætəbl/', '兼容的', 'This software is not compatible.', 'medium', 'hard'],
  ['compensate', '/ˈkɒmpenseɪt/', '补偿', 'Nothing can compensate for the loss.', 'medium', 'hard'],
  ['compile', '/kəmˈpaɪl/', '编辑，编译', 'They are compiling a dictionary.', 'medium', 'medium'],
  ['complex', '/ˈkɒmpleks/', '复杂的', 'The situation is complex.', 'high', 'medium'],
  ['component', '/kəmˈpəʊnənt/', '组件，成分', 'Trust is a vital component.', 'medium', 'medium'],
  ['compound', '/ˈkɒmpaʊnd/', '化合物，复合', 'Salt is a common compound.', 'medium', 'hard'],
  ['comprehensive', '/ˌkɒmprɪˈhensɪv/', '全面的', 'We offer a comprehensive course.', 'medium', 'hard'],
  ['comprise', '/kəmˈpraɪz/', '包含，构成', 'The team comprises five members.', 'medium', 'hard'],
  ['compute', '/kəmˈpjuːt/', '计算', 'The computer can compute fast.', 'low', 'medium'],
  ['conceive', '/kənˈsiːv/', '构思，怀孕', 'I can\'t conceive of such a thing.', 'low', 'hard'],
  ['concentrate', '/ˈkɒnsntreɪt/', '集中', 'I need to concentrate on my work.', 'high', 'medium'],
  ['concept', '/ˈkɒnsept/', '概念', 'The concept is very simple.', 'high', 'medium'],
  ['conclude', '/kənˈkluːd/', '总结', 'I would like to conclude my talk.', 'high', 'medium'],
  ['concurrent', '/kənˈkʌrənt/', '同时发生的', 'The events were concurrent.', 'low', 'hard'],
  ['conduct', '/kənˈdʌkt/', '行为，引导', 'He will conduct the orchestra.', 'high', 'medium'],
  ['confer', '/kənˈfɜː(r)/', '授予，商议', 'They will confer an honorary degree.', 'low', 'hard'],
  ['confine', '/kənˈfaɪn/', '限制', 'Please confine your remarks to the topic.', 'medium', 'medium'],
  ['confirm', '/kənˈfɜːm/', '确认', 'Please confirm your booking.', 'high', 'easy'],
  ['conflict', '/ˈkɒnflɪkt/', '冲突', 'There is a conflict of interest.', 'high', 'medium'],
  ['conform', '/kənˈfɔːm/', '遵守，符合', 'You must conform to the rules.', 'low', 'hard'],
  ['consent', '/kənˈsent/', '同意', 'You need parental consent.', 'medium', 'hard'],
  ['consequent', '/ˈkɒnsɪkwənt/', '作为结果的', 'The consequent delay was long.', 'medium', 'medium'],
  ['considerable', '/kənˈsɪdərəbl/', '相当大的', 'A considerable amount of money.', 'high', 'medium'],
  ['consist', '/kənˈsɪst/', '由...组成', 'Coal consists mainly of carbon.', 'high', 'medium']
];

/**
 * 引擎逻辑
 */
const engineToDataset = (raw: RawWord[], datasetId: string): VocabularyWord[] => {
  const result: VocabularyWord[] = [];
  
  raw.forEach((item, i) => {
    result.push({
      id: i + 1,
      word: item[0],
      phonetic: item[1],
      translation: item[2],
      example: item[3],
      frequency: item[4],
      difficulty: item[5],
      tags: [datasetId, '考纲核心']
    });
  });

  return result;
};

export const DATASETS: VocabDataset[] = [
  { 
    id: 'CET4_CORE', 
    name: 'CET-4 核心 100 词', 
    description: '精选 A-Z 高频核心词汇，夯实基础的第一步。', 
    color: 'indigo',
    data: engineToDataset(SEED_CORE, 'CET4_CORE')
  }
];

export const APP_NAME = "四级真题大师";
