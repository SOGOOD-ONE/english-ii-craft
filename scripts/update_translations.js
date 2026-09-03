import fs from 'fs';
import path from 'path';

export const allTranslations = {
  2010: {
    year: 2010,
    source: `"Sustainability" has become a popular word these days, but to Ted Ning, the concept will always have personal meaning. Having endured a painful period of unsustainability in his own life made it clear to him that sustainability-oriented values must be expressed through everyday action and choice.

Ning recalls spending a confusing year in the late 1990s selling insurance. He'd been through the dot-com boom and burst and, desperate for a job, signed on with a Boulder agency.

It didn't go well. "It was a really bad move because that's not my passion," says Ning, whose dilemma about the job translated, predictably, into a lack of sales. "I was miserable. I had so much anxiety that I would wake up in the middle of the night and stare at the ceiling. I had no money and needed the job. Everyone said, 'Just wait, you'll turn the corner, give it some time.'"`,
    refZh: `如今，“可持续性”已成为一个流行词，但对特德·宁来说，这个概念始终具有个人意义。在自身生活中度过了一段痛苦的“不可持续”时期之后，他清楚地认识到，以可持续性为导向的价值观必须通过日常行动和抉择来体现。

宁回忆起在20世纪90年代末卖保险时度过的那段迷茫的一年。他经历了互联网的繁荣与泡沫破裂，急于找一份工作，便与博尔德的一家机构签约。

然而事情并不顺利。“这真是一个糟糕的选择，因为那不是我的热情所在，”宁说道。不出所料，他对这份工作的两难心态转化为了惨淡的销售业绩。“我当时痛苦不堪。我焦虑得半夜醒来盯着天花板发呆。我身无分文，又急需这份工作。每个人都说：‘等等看，情况会好转的，给它一点时间。’”`,
    slices: [
      {
        id: "s1",
        text: `"Sustainability" has become a popular word these days, but to Ted Ning, the concept will always have personal meaning.`,
        refZh: `如今，“可持续性”已成为一个流行词，但对特德·宁来说，这个概念始终具有个人意义。`,
        points: ["popular word（流行词）", "have personal meaning（具有个人意义）"],
        pitfalls: ["but to Ted Ning 放在句子中间作状语，翻译时需提前至主句前"]
      },
      {
        id: "s2",
        text: `Having endured a painful period of unsustainability in his own life made it clear to him that sustainability-oriented values must be expressed through everyday action and choice.`,
        refZh: `在自身生活中度过了一段痛苦的“不可持续”时期之后，他清楚地认识到，以可持续性为导向的价值观必须通过日常行动和抉择来体现。`,
        points: ["Having endured... 现在分词短语作主语或时间状语", "made it clear that... 形式宾语结构", "sustainability-oriented values（以可持续性为导向的价值观）"],
        pitfalls: ["made it clear to him that 结构容易漏译形式宾语 it 所指代的内容"]
      },
      {
        id: "s3",
        text: `Ning recalls spending a confusing year in the late 1990s selling insurance.`,
        refZh: `宁回忆起在20世纪90年代末卖保险时度过的那段迷茫的一年。`,
        points: ["recalls spending（回忆起度过……）", "confusing year（迷茫的一年）", "selling insurance 现在分词作伴随状语"],
        pitfalls: ["selling insurance 修饰前面的 year 或 Ning 在那一年的经历，译为“卖保险度过的那一年”"]
      },
      {
        id: "s4",
        text: `He'd been through the dot-com boom and burst and, desperate for a job, signed on with a Boulder agency.`,
        refZh: `他经历了互联网的繁荣与泡沫破裂，急于找一份工作，便与博尔德的一家机构签约。`,
        points: ["dot-com boom and burst（互联网繁荣与破裂/泡沫破灭）", "desperate for a job（急需工作，形容词短语作状语）", "signed on with（与……签约/入职）"],
        pitfalls: ["Boulder agency 是地名加机构，可音译为“博尔德的一家机构”"]
      },
      {
        id: "s5",
        text: `It didn't go well.`,
        refZh: `然而事情并不顺利。`,
        points: ["go well（进展顺利）"],
        pitfalls: ["注意语境转折语气，译出“并不顺利/并不如意”"]
      },
      {
        id: "s6",
        text: `"It was a really bad move because that's not my passion," says Ning, whose dilemma about the job translated, predictably, into a lack of sales.`,
        refZh: `“这真是一个糟糕的选择，因为那不是我的热情所在，”宁说道。不出所料，他对这份工作的两难心态转化为了惨淡的销售业绩。`,
        points: ["bad move（糟糕的举措/选择）", "whose dilemma... 定语从句", "translated into（转化为/体现为）", "predictably（不出所料）"],
        pitfalls: ["translated into 此处引申为“导致/转化为”，不宜字面生硬直译为“翻译成”"]
      },
      {
        id: "s7",
        text: `"I was miserable.`,
        refZh: `“我当时痛苦不堪。`,
        points: ["miserable（痛苦的，难受的）"],
        pitfalls: ["情感形容词翻译需贴合语境"]
      },
      {
        id: "s8",
        text: `I had so much anxiety that I would wake up in the middle of the night and stare at the ceiling.`,
        refZh: `我焦虑得半夜醒来盯着天花板发呆。`,
        points: ["so... that...（如此……以至于……）", "in the middle of the night（半夜）", "stare at the ceiling（凝视天花板）"],
        pitfalls: ["so much anxiety that 结果状语从句需顺译出因果关系"]
      },
      {
        id: "s9",
        text: `I had no money and needed the job.`,
        refZh: `我身无分文，又急需这份工作。`,
        points: ["had no money（身无分文/没有钱）"],
        pitfalls: ["简洁有力顺译"]
      },
      {
        id: "s10",
        text: `Everyone said, 'Just wait, you'll turn the corner, give it some time.'"`,
        refZh: `每个人都说：‘等等看，情况会好转的，给它一点时间。’”。`,
        points: ["turn the corner（拐弯/迎来转机/情况好转）", "give it some time（给它一些时间）"],
        pitfalls: ["turn the corner 是习语，意为“转危为安/走出困境/情况好转”，切勿直译为“转弯”"]
      }
    ]
  },
  2011: {
    year: 2011,
    source: `Who would have thought that, globally, the IT industry produces about the same volume of greenhouse gases as the world's airlines do – roughly 2 percent of all CO2 emissions?

Many everyday tasks take a surprising toll on the environment. A Google search can leak between 0.2 and 7.0 grams of CO2, depending on how many attempts are needed to get the "right" answer. To deliver results to its users quickly, then, Google has to maintain vast data centres around the world, packed with powerful computers. While producing large quantities of CO2, these computers emit a great deal of heat, so the centres need to be well air-conditioned, which uses even more energy.

However, Google and other big tech providers monitor their efficiency closely and make improvements. Monitoring is the first step on the road to reduction, but there is much more to be done, and not just by big companies.`,
    refZh: `谁能想到，放眼全球，IT行业产生的温室气体总量几乎与全球航空业相当——大约占二氧化碳排放总量的2%？

许多日常事务都对环境造成了惊人的破坏。一次谷歌搜索会释放0.2到7.0克的二氧化碳，具体取决于需要尝试多少次才能获得“正确”答案。那么，为了快速向用户提供结果，谷歌必须在全球维护庞大的数据中心，里面挤满了功能强大的计算机。在产生大量二氧化碳的同时，这些计算机还会散发大量的热量，因此数据中心需要良好的空调系统降温，这又会消耗更多的能源。

然而，谷歌和其他大型科技巨头正密切监控其能源效率并做出改进。监控是走向减排的第一步，但还有更多工作要做，而且不仅需要大公司来做。`,
    slices: [
      {
        id: "s1",
        text: `Who would have thought that, globally, the IT industry produces about the same volume of greenhouse gases as the world's airlines do – roughly 2 percent of all CO2 emissions?`,
        refZh: `谁能想到，放眼全球，IT行业产生的温室气体总量几乎与全球航空业相当——大约占二氧化碳排放总量的2%？`,
        points: ["Who would have thought that（谁能想到……）", "the same volume of... as...（与……相当的量）", "greenhouse gases（温室气体）", "CO2 emissions（二氧化碳排放）"],
        pitfalls: ["the same volume of... as... 的同级比较结构要翻译完整"]
      },
      {
        id: "s2",
        text: `Many everyday tasks take a surprising toll on the environment.`,
        refZh: `许多日常事务都对环境造成了惊人的破坏。`,
        points: ["everyday tasks（日常任务/日常事务）", "take a toll on（对……造成破坏/造成损失）", "surprising（令人惊讶的/惊人的）"],
        pitfalls: ["take a toll on 是固定习语，切忌直译为“收费”"]
      },
      {
        id: "s3",
        text: `A Google search can leak between 0.2 and 7.0 grams of CO2, depending on how many attempts are needed to get the "right" answer.`,
        refZh: `一次谷歌搜索会释放0.2到7.0克的二氧化碳，具体取决于需要尝试多少次才能获得“正确”答案。`,
        points: ["leak（泄露/释放）", "depending on（取决于……）", "attempts（尝试次数）"],
        pitfalls: ["depending on 分词短语作条件状语，后置翻译或提至前句翻译均可"]
      },
      {
        id: "s4",
        text: `To deliver results to its users quickly, then, Google has to maintain vast data centres around the world, packed with powerful computers.`,
        refZh: `那么，为了快速向用户提供结果，谷歌必须在全球维护庞大的数据中心，里面挤满了功能强大的计算机。`,
        points: ["To deliver results... 目的状语", "maintain vast data centres（维护庞大的数据中心）", "packed with 过去分词短语作后置定语（塞满/挤满）"],
        pitfalls: ["packed with 修饰 data centres，需译为“装有/挤满大量高性能计算机的数据中心”"]
      },
      {
        id: "s5",
        text: `While producing large quantities of CO2, these computers emit a great deal of heat, so the centres need to be well air-conditioned, which uses even more energy.`,
        refZh: `在产生大量二氧化碳的同时，这些计算机还会散发大量的热量，因此数据中心需要良好的空调系统降温，这又会消耗更多的能源。`,
        points: ["While doing...（在……的同时，表伴随/让步）", "emit a great deal of heat（散发大量热量）", "well air-conditioned（良好的空调制冷环境）", "which uses... 非限制性定语从句"],
        pitfalls: ["well air-conditioned 是复合形容词，需意译为“配备良好的空调/充分制冷降温”"]
      },
      {
        id: "s6",
        text: `However, Google and other big tech providers monitor their efficiency closely and make improvements.`,
        refZh: `然而，谷歌和其他大型科技巨头正密切监控其能源效率并做出改进。`,
        points: ["tech providers（技术提供商/科技公司）", "monitor closely（密切监控）", "efficiency（效率）"],
        pitfalls: ["closely 作副词修饰 monitor"]
      },
      {
        id: "s7",
        text: `Monitoring is the first step on the road to reduction, but there is much more to be done, and not just by big companies.`,
        refZh: `监控是走向减排的第一步，但还有更多工作要做，而且不仅需要大公司来做。`,
        points: ["on the road to reduction（在减排的道路上）", "there is much more to be done（还有更多事情要做）", "not just by（不仅由……）"],
        pitfalls: ["not just by big companies 伴随承前省略，需补全动词含义“不仅需要大公司来承担/做”"]
      }
    ]
  },
  2012: {
    year: 2012,
    source: `When people in developing countries worry about migration, they are usually concerned at the prospect of their best and brightest departure to Silicon Valley or to hospitals and universities in the developed world. These are the kind of workers that countries like Britain, Canada and Australia try to attract by using immigration rules that privilege college graduates.

Lots of studies have found that well-educated people from developing countries are particularly likely to emigrate. A big survey of Indian households in 2004 found that nearly 40% of emigrants had more than a high-school education, compared with around 3.3% of all Indians over the age 25. This "brain drain" has long bothered policymakers in poor countries. They fear that it hurts their economies, depriving them of much-needed skilled workers who could have taught at their universities, worked in their hospitals and come up with clever new products for their factories to make.`,
    refZh: `当发展中国家的人们担忧移民问题时，他们通常担心的是最优秀、最聪明的人才前往硅谷，或者流向发达国家的医院和大学。像英国、加拿大和澳大利亚这样的国家正是试图通过给予大学毕业生特权的移民政策来吸引这类劳动者。

大量研究发现，来自发展中国家受过良好教育的人才尤其倾向于移民。2004年对印度家庭的一项大规模调查发现，在所有移民中，近40%拥有高中以上学历，而25岁以上的全部印度人中这一比例仅为3.3%左右。这种“人才流失”长期困扰着贫穷国家的决策者。他们担心这会损害本国经济，使他们失去急需的技术工人——而这些人本可以在他们本国的大学任教、在医院工作，或者为他们的工厂开发出创新的产品。`,
    slices: [
      {
        id: "s1",
        text: `When people in developing countries worry about migration, they are usually concerned at the prospect of their best and brightest departure to Silicon Valley or to hospitals and universities in the developed world.`,
        refZh: `当发展中国家的人们担忧移民问题时，他们通常担心的是最优秀、最聪明的人才前往硅谷，或者流向发达国家的医院和大学。`,
        points: ["developing countries（发展中国家）", "concerned at the prospect of（对……的前景感到担忧）", "the best and brightest（最优秀和最聪明的人才，形容词名词化）"],
        pitfalls: ["the best and brightest 指代最杰出的人才，切忌字面生硬翻译为“最好和最亮的人”"]
      },
      {
        id: "s2",
        text: `These are the kind of workers that countries like Britain, Canada and Australia try to attract by using immigration rules that privilege college graduates.`,
        refZh: `像英国、加拿大和澳大利亚这样的国家正是试图通过给予大学毕业生特权的移民政策来吸引这类劳动者。`,
        points: ["immigration rules that privilege...（给予……优待/特权的移民规则）", "college graduates（大学毕业生）"],
        pitfalls: ["privilege 此处用作及物动词，意为“给予特权/给予优待”"]
      },
      {
        id: "s3",
        text: `Lots of studies have found that well-educated people from developing countries are particularly likely to emigrate.`,
        refZh: `大量研究发现，来自发展中国家受过良好教育的人才尤其倾向于移民。`,
        points: ["well-educated people（受过良好教育的人）", "be likely to emigrate（很可能移民/倾向于移民）"],
        pitfalls: ["emigrate 指“移居国外/迁出本国”"]
      },
      {
        id: "s4",
        text: `A big survey of Indian households in 2004 found that nearly 40% of emigrants had more than a high-school education, compared with around 3.3% of all Indians over the age 25.`,
        refZh: `2004年对印度家庭的一项大规模调查发现，在所有移民中，近40%拥有高中以上学历，而25岁以上的全部印度人中这一比例仅为3.3%左右。`,
        points: ["Indian households（印度家庭）", "more than a high-school education（高中以上学历）", "compared with（与……相比，分词短语作状语）"],
        pitfalls: ["compared with 引导对比结构，数据对比需表达准确清楚"]
      },
      {
        id: "s5",
        text: `This "brain drain" has long bothered policymakers in poor countries.`,
        refZh: `这种“人才流失”长期困扰着贫穷国家的决策者。`,
        points: ["brain drain（人才流失/智力外流）", "bothered policymakers（困扰决策制定者）"],
        pitfalls: ["brain drain 为固定专有名词，译为“人才流失”或“智力外流”"]
      },
      {
        id: "s6",
        text: `They fear that it hurts their economies, depriving them of much-needed skilled workers who could have taught at their universities, worked in their hospitals and come up with clever new products for their factories to make.`,
        refZh: `他们担心这会损害本国经济，使他们失去急需的技术工人——而这些人本可以在他们本国的大学任教、在医院工作，或者为他们的工厂开发出创新的产品。`,
        points: ["depriving them of...（剥夺/使失去……，分词作伴随结果状语）", "who could have taught... 虚拟语气（本可以任教……）", "come up with clever new products（构想/开发出创新的产品）"],
        pitfalls: ["could have done 表示“本可以做到某事但未能实现”，包含虚拟语气让步含义"]
      }
    ]
  },
  2013: {
    year: 2013,
    source: `I can pick a date from the past 53 years and know instantly where I was, what happened in the news and even the day of the week. I've been able to do this since I was four.

I never feel overwhelmed with the amount of information my brain absorbs. My mind seems to be able to cope and the information is stored away neatly. When I think of a sad memory, I do what everybody does – try to put it to one side. I don't think it's harder for me just because my memory is clearer. Powerful memory doesn't make my emotions any more acute or vivid. I can recall the day my grandfather died and the sadness I felt when we went to the hospital the day before. I also remember that the musical play Hair opened on Broadway on the same day – they both just pop into my mind in the same way.`,
    refZh: `我可以从过去的53年中随手指一个日期，就能立刻知道当时自己在哪里、新闻中发生了什么，甚至能说出那是星期几。我从四岁起就能做到这一点。

我从未对大脑所吸收的大量信息感到不知所措。我的头脑似乎能够应付，而且信息被整齐地储存起来。当我想起一段悲伤的记忆时，我会像所有人一样——尽量把它放在一边。我并不认为仅仅因为我的记忆更清晰，对我来说就会更艰难。强大的记忆力并没有让我的情绪变得更加敏锐或生动。我能清晰地回忆起祖父去世的那一天，以及前一天我们去医院时我感受到的悲伤。我也记得音乐剧《毛发》在同一天于百老汇首演——这两件事以完全相同的方式浮现在我的脑海中。`,
    slices: [
      {
        id: "s1",
        text: `I can pick a date from the past 53 years and know instantly where I was, what happened in the news and even the day of the week.`,
        refZh: `我可以从过去的53年中随手指一个日期，就能立刻知道当时自己在哪里、新闻中发生了什么，甚至能说出那是星期几。`,
        points: ["pick a date（选定一个日期）", "know instantly（立刻知道）", "the day of the week（星期几）"],
        pitfalls: ["the day of the week 意为“星期几”，非“一周的日期”"]
      },
      {
        id: "s2",
        text: `I've been able to do this since I was four.`,
        refZh: `我从四岁起就能做到这一点。`,
        points: ["since I was four（从我四岁起）"],
        pitfalls: ["现在完成时体现持续状态"]
      },
      {
        id: "s3",
        text: `I never feel overwhelmed with the amount of information my brain absorbs.`,
        refZh: `我从未对大脑所吸收的大量信息感到不知所措。`,
        points: ["feel overwhelmed with（对……感到不知所措/承受不住）", "my brain absorbs 定语从句修饰 information"],
        pitfalls: ["overwhelmed 表达被信息淹没或压垮"]
      },
      {
        id: "s4",
        text: `My mind seems to be able to cope and the information is stored away neatly.`,
        refZh: `我的头脑似乎能够应付，而且信息被整齐地储存起来。`,
        points: ["cope（应付/处理）", "stored away neatly（整齐地储存/归档）"],
        pitfalls: ["stored away neatly 需准确体现“整齐归置/储存”的意象"]
      },
      {
        id: "s5",
        text: `When I think of a sad memory, I do what everybody does – try to put it to one side.`,
        refZh: `当我想起一段悲伤的记忆时，我会像所有人一样——尽量把它放在一边。`,
        points: ["put it to one side（把它搁置在一旁/不去想它）", "what everybody does 宾语从句"],
        pitfalls: ["put to one side 是比喻性短语，意为“暂且搁置/避开不谈”"]
      },
      {
        id: "s6",
        text: `I don't think it's harder for me just because my memory is clearer.`,
        refZh: `我并不认为仅仅因为我的记忆更清晰，对我来说就会更艰难。`,
        points: ["just because...（仅仅因为……）", "harder for me（对我而言更难受/艰难）"],
        pitfalls: ["否定转移与因果从句的逻辑关联"]
      },
      {
        id: "s7",
        text: `Powerful memory doesn't make my emotions any more acute or vivid.`,
        refZh: `强大的记忆力并没有让我的情绪变得更加敏锐或生动。`,
        points: ["powerful memory（强大的记忆力）", "acute or vivid（敏锐或生动/强烈）", "not... any more（不再/并没有更……）"],
        pitfalls: ["acute 形容感知敏锐、强烈"]
      },
      {
        id: "s8",
        text: `I can recall the day my grandfather died and the sadness I felt when we went to the hospital the day before.`,
        refZh: `我能清晰地回忆起祖父去世的那一天，以及前一天我们去医院时我感受到的悲伤。`,
        points: ["recall the day（回忆起那天）", "the day before（前一天）", "the sadness I felt 定语从句"],
        pitfalls: ["the day before 指祖父去世的前一天"]
      },
      {
        id: "s9",
        text: `I also remember that the musical play Hair opened on Broadway on the same day – they both just pop into my mind in the same way.`,
        refZh: `我也记得音乐剧《毛发》在同一天于百老汇首演——这两件事以完全相同的方式浮现在我的脑海中。`,
        points: ["musical play Hair（音乐剧《毛发》）", "opened on Broadway（在百老汇首演/上映）", "pop into my mind（跳入/浮现在我的脑海中）"],
        pitfalls: ["opened on Broadway 指音乐剧开演/首演，pop into one's mind 为生动短语"]
      }
    ]
  },
  2014: {
    year: 2014,
    source: `Most people would define optimism as being endlessly happy, with a glass that's perpetually half full. But that's exactly the kind of false cheerfulness that positive psychologists wouldn't recommend. "Healthy optimism means being in touch with reality," says Tal Ben-Shahar, a Harvard professor. According to Ben-Shahar, realistic optimists are those who make the best of things that happen, but not those who believe everything happens for the best.

Ben-Shahar uses three optimistic exercises. When he feels down – say, after giving a bad lecture – he grants himself permission to be human. He reminds himself that not every lecture can be a Nobel winner; some will be less effective than others. Next is reconstruction. He analyzes the weak lecture, learning lessons for the future about what works and what doesn't. Finally, there is perspective, which involves acknowledging that in the grand scheme of life, one lecture really doesn't matter.`,
    refZh: `大多数人会把乐观定义为无休止的快乐，如同一个永远半满的水杯。但这恰恰是积极心理学家所不推崇的那种虚假的快乐。“健康的乐观意味着脚踏实地、立足现实，”哈佛大学教授塔尔·本-沙哈尔说道。本-沙哈尔认为，现实的乐观主义者是那些能充分利用所发生事情的人，而不是那些坚信一切事情都会有最好结果的人。

本-沙哈尔采用了三种乐观练习方法。当他情绪低落时——比如做了一场糟糕的演讲后——他允许自己是一个普通人。他提醒自己，并非每场演讲都能达到诺贝尔奖的水准；有些演讲的效果必然不如其他演讲。其次是重构。他会剖析那场表现不佳的演讲，为未来吸取经验，明白什么是有效的、什么是无效的。最后是全局视角，这需要承认在人生的宏伟蓝图中，一场演讲其实无足轻重。`,
    slices: [
      {
        id: "s1",
        text: `Most people would define optimism as being endlessly happy, with a glass that's perpetually half full.`,
        refZh: `大多数人会把乐观定义为无休止的快乐，如同一个永远半满的水杯。`,
        points: ["define... as...（把……定义为……）", "endlessly happy（无休止的快乐）", "perpetually half full（永远是半满的）"],
        pitfalls: ["half full 是西方著名的乐观隐喻（看到半杯水是满的而不是空的）"]
      },
      {
        id: "s2",
        text: `But that's exactly the kind of false cheerfulness that positive psychologists wouldn't recommend.`,
        refZh: `但这恰恰是积极心理学家所不推崇的那种虚假的快乐。`,
        points: ["false cheerfulness（虚假的快乐/盲目的乐观）", "positive psychologists（积极心理学家）", "recommend（推荐/提倡）"],
        pitfalls: ["false cheerfulness 需准确译出“虚假/强颜欢笑”之意"]
      },
      {
        id: "s3",
        text: `"Healthy optimism means being in touch with reality," says Tal Ben-Shahar, a Harvard professor.`,
        refZh: `“健康的乐观意味着脚踏实地、立足现实，”哈佛大学教授塔尔·本-沙哈尔说道。`,
        points: ["in touch with reality（与现实保持接触/立足现实）", "Healthy optimism（健康的乐观）"],
        pitfalls: ["in touch with reality 意译为“立足现实/脚踏实地”更为地道"]
      },
      {
        id: "s4",
        text: `According to Ben-Shahar, realistic optimists are those who make the best of things that happen, but not those who believe everything happens for the best.`,
        refZh: `本-沙哈尔认为，现实的乐观主义者是那些能充分利用所发生事情的人，而不是那些坚信一切事情都会有最好结果的人。`,
        points: ["realistic optimists（现实的乐观主义者）", "make the best of（充分利用/随遇而安）", "happen for the best（朝最好的方向发展/带来最好的结果）"],
        pitfalls: ["make the best of 与 happen for the best 两处短语对比需区分清楚"]
      },
      {
        id: "s5",
        text: `Ben-Shahar uses three optimistic exercises.`,
        refZh: `本-沙哈尔采用了三种乐观练习方法。`,
        points: ["optimistic exercises（乐观练习方法/积极思维训练）"],
        pitfalls: ["exercises 此处指心理训练或调节练习"]
      },
      {
        id: "s6",
        text: `When he feels down – say, after giving a bad lecture – he grants himself permission to be human.`,
        refZh: `当他情绪低落时——比如做了一场糟糕的演讲后——他允许自己是一个普通人。`,
        points: ["feels down（情绪低落/沮丧）", "say（比方说/譬如，作插入语）", "grants himself permission to be human（准许自己也是凡人/接纳自己的人性）"],
        pitfalls: ["permission to be human 是本-沙哈尔的经典概念，指接纳自己并非完美、允许自己有凡人的情绪"]
      },
      {
        id: "s7",
        text: `He reminds himself that not every lecture can be a Nobel winner; some will be less effective than others.`,
        refZh: `他提醒自己，并非每场演讲都能达到诺贝尔奖的水准；有些演讲的效果必然不如其他演讲。`,
        points: ["Nobel winner（诺贝尔奖得主/诺奖水准的杰作）", "less effective than others（效果不如其他演讲）", "not every 部分否定（并非每一场）"],
        pitfalls: ["not every 为部分否定，不可译为“所有演讲都不能……”"]
      },
      {
        id: "s8",
        text: `Next is reconstruction.`,
        refZh: `其次是重构。`,
        points: ["reconstruction（认知重构/事后重塑）"],
        pitfalls: ["心理学名词，指重新审视和分析事件"]
      },
      {
        id: "s9",
        text: `He analyzes the weak lecture, learning lessons for the future about what works and what doesn't.`,
        refZh: `他会剖析那场表现不佳的演讲，为未来吸取经验，明白什么是有效的、什么是无效的。`,
        points: ["weak lecture（表现不佳/薄弱的演讲）", "learning lessons（吸取教训/总结经验）", "what works and what doesn't（什么是奏效的、什么是不奏效的）"],
        pitfalls: ["what works and what doesn't 宾语从句需通顺译出"]
      },
      {
        id: "s10",
        text: `Finally, there is perspective, which involves acknowledging that in the grand scheme of life, one lecture really doesn't matter.`,
        refZh: `最后是全局视角，这需要承认在人生的宏伟蓝图中，一场演讲其实无足轻重。`,
        points: ["perspective（大局观/长远视角）", "in the grand scheme of life（在人生的宏大蓝图/格局中）", "doesn't matter（无关紧要/无足轻重）"],
        pitfalls: ["in the grand scheme of life 是固定习语，意为“从长远或人生全局来看”"]
      }
    ]
  },
  2015: {
    year: 2015,
    source: `Think about driving a route that's very familiar. It could be your commute to work, a trip into town or the way home. Whichever it is, you know every twist and turn like the back of your hand. On these sorts of trips it's easy to lose concentration on the driving and pay little attention to the passing scenery. The consequence is that you perceive that the trip has taken less time than it actually has.

This is the well-travelled road effect: people tend to underestimate the time it takes to travel a familiar route.

The effect is caused by the way we allocate our attention. When we travel down a well-known route, because we don't have to concentrate much, time seems to flow more quickly. And afterwards, when we come to think back on it, we can't remember the journey well because we didn't pay much attention to it. So we assume it was shorter.`,
    refZh: `设想一下驾车行驶在一条你非常熟悉的线路上。这可能是你的上下班通勤之路、进城之旅或是回家的路。无论是哪一种，你都对每一个弯道了如指掌。在这些行程中，人们很容易在驾驶时注意力分散，几乎不怎么关注沿途掠过的风景。其结果就是，你会觉得这段旅程所花费的时间比实际耗费的时间要短。

这就是“熟路效应”：人们往往会低估走一条熟悉路线所需要的时间。

这种效应是由我们分配注意力的方式所造成的。当我们行驶在一条熟悉的路线上时，由于我们不需要高度集中注意力，时间似乎流逝得更快。而事后当我们要回想起来时，我们无法把这段旅程记得很清楚，因为我们当时并没有对它倾注太多关注。因此，我们便想当然地认为它耗时更短。`,
    slices: [
      {
        id: "s1",
        text: `Think about driving a route that's very familiar.`,
        refZh: `设想一下驾车行驶在一条你非常熟悉的线路上。`,
        points: ["Think about（设想一下/思考……）", "a route that's very familiar 定语从句"],
        pitfalls: ["祈使句开头，译出邀请读者设想的语气"]
      },
      {
        id: "s2",
        text: `It could be your commute to work, a trip into town or the way home.`,
        refZh: `这可能是你的上下班通勤之路、进城之旅或是回家的路。`,
        points: ["commute to work（上下班通勤）", "trip into town（进城一趟）", "the way home（回家的路）"],
        pitfalls: ["commute 准确译为“上下班通勤”"]
      },
      {
        id: "s3",
        text: `Whichever it is, you know every twist and turn like the back of your hand.`,
        refZh: `无论是哪一种，你都对每一个弯道了如指掌。`,
        points: ["Whichever it is（无论是哪一个，让步状语从句）", "every twist and turn（每一个拐弯/转折）", "like the back of your hand（了如指掌/烂熟于心）"],
        pitfalls: ["like the back of your hand 是习语，意为“了如指掌”，切勿直译为“像手背一样”"]
      },
      {
        id: "s4",
        text: `On these sorts of trips it's easy to lose concentration on the driving and pay little attention to the passing scenery.`,
        refZh: `在这些行程中，人们很容易在驾驶时注意力分散，几乎不怎么关注沿途掠过的风景。`,
        points: ["lose concentration on（注意力不集中/分散）", "pay little attention to（几乎不注意，否定含义）", "passing scenery（掠过的风景）"],
        pitfalls: ["little 表示否定“几乎没有”，不能译为“付出一小点注意”"]
      },
      {
        id: "s5",
        text: `The consequence is that you perceive that the trip has taken less time than it actually has.`,
        refZh: `其结果就是，你会觉得这段旅程所花费的时间比实际耗费的时间要短。`,
        points: ["The consequence is that 表语从句", "perceive that 宾语从句（感知到/觉得）", "taken less time than it actually has（花费比实际上更少的时间）"],
        pitfalls: ["双层 that 从句需理清主次层级关系，has 后面省略了 taken"]
      },
      {
        id: "s6",
        text: `This is the well-travelled road effect: people tend to underestimate the time it takes to travel a familiar route.`,
        refZh: `这就是“熟路效应”：人们往往会低估走一条熟悉路线所需要的时间。`,
        points: ["well-travelled road effect（熟路效应/常走之路效应）", "underestimate（低估）", "the time it takes to do...（做某事所花费的时间）"],
        pitfalls: ["well-travelled road effect 为心理学术语，译为“熟路效应”最标准"]
      },
      {
        id: "s7",
        text: `The effect is caused by the way we allocate our attention.`,
        refZh: `这种效应是由我们分配注意力的方式所造成的。`,
        points: ["be caused by（由……引起/造成）", "the way we allocate our attention 定语从句（我们分配注意力的方式）"],
        pitfalls: ["allocate attention 译为“分配注意力”"]
      },
      {
        id: "s8",
        text: `When we travel down a well-known route, because we don't have to concentrate much, time seems to flow more quickly.`,
        refZh: `当我们行驶在一条熟悉的路线上时，由于我们不需要高度集中注意力，时间似乎流逝得更快。`,
        points: ["well-known route（熟知的路线）", "concentrate much（高度专注）", "time seems to flow more quickly（时间似乎流逝得更快）"],
        pitfalls: ["嵌套状语从句，需按汉语习惯先因后果理顺"]
      },
      {
        id: "s9",
        text: `And afterwards, when we come to think back on it, we can't remember the journey well because we didn't pay much attention to it.`,
        refZh: `而事后当我们要回想起来时，我们无法把这段旅程记得很清楚，因为我们当时并没有对它倾注太多关注。`,
        points: ["afterwards（事后）", "think back on it（回想/追忆它）", "remember well（记忆清晰）"],
        pitfalls: ["多重从句，按时间顺序顺译"]
      },
      {
        id: "s10",
        text: `So we assume it was shorter.`,
        refZh: `因此，我们便想当然地认为它耗时更短。`,
        points: ["assume（假设/想当然地认为）", "it was shorter（时间更短/耗时更少）"],
        pitfalls: ["shorter 指时间上的短暂"]
      }
    ]
  },
  2016: {
    year: 2016,
    source: `The supermarket is designed to lure customers into spending as much time as possible within its doors. The reason for this is simple: The longer you stay in the store, the more stuff you'll see, and the more stuff you see, the more you'll buy. And supermarkets contain a lot of stuff. The average supermarket, according to the Food Marketing Institute, carries some 44,000 different items, and many carry tens of thousands more.

The sheer volume of available choice is enough to send shoppers into a state of information overload. According to brain-scan experiments, the demands of so much decision-making quickly become too much for us. After about 40 minutes of shopping, most people stop struggling to be rationally selective, and instead begin shopping emotionally – which is the point at which we accumulate the 50 percent of stuff in our cart that we never intended buying.`,
    refZh: `超市的设计初衷就是为了诱导顾客在店内逗留尽可能长的时间。究其原因很简单：你在店里停留的时间越长，看到的商品就越多；而你看到的商品越多，购买的也就越多。而且超市里确实充斥着琳琅满目的商品。据食品营销协会统计，普通超市备有约4.4万种不同的商品，许多超市拥有的商品数量甚至比这还要多出数万种。

单单是可供选择的庞大数量，就足以让购物者陷入信息过载的状态。大脑扫描实验表明，做出如此多决定的要求很快就会让我们不堪重负。在购物约40分钟后，大多数人便不再费力去进行理性的挑选，转而开始进行感性消费——正是在这个时候，我们购物车里累积了多达50%原本从未打算购买的商品。`,
    slices: [
      {
        id: "s1",
        text: `The supermarket is designed to lure customers into spending as much time as possible within its doors.`,
        refZh: `超市的设计初衷就是为了诱导顾客在店内逗留尽可能长的时间。`,
        points: ["be designed to（旨在/设计初衷是……）", "lure... into doing...（引诱/诱导……做某事）", "within its doors（在店内/在门店内）"],
        pitfalls: ["lure into doing 意为“诱使某人做某事”，within its doors 为比喻用法，指“在超市店内”"]
      },
      {
        id: "s2",
        text: `The reason for this is simple: The longer you stay in the store, the more stuff you'll see, and the more stuff you see, the more you'll buy.`,
        refZh: `究其原因很简单：你在店里停留的时间越长，看到的商品就越多；而你看到的商品越多，购买的也就越多。`,
        points: ["The reason for this is simple（原因很简单）", "the + 比较级..., the + 比较级...（越……，越……）", "stuff（商品/物品）"],
        pitfalls: ["双重 the more... the more 结构需译出严密的递进因果关系"]
      },
      {
        id: "s3",
        text: `And supermarkets contain a lot of stuff.`,
        refZh: `而且超市里确实充斥着琳琅满目的商品。`,
        points: ["contain a lot of stuff（包含大量商品/物品繁多）"],
        pitfalls: ["stuff 此处指超市货架上的货物/商品"]
      },
      {
        id: "s4",
        text: `The average supermarket, according to the Food Marketing Institute, carries some 44,000 different items, and many carry tens of thousands more.`,
        refZh: `据食品营销协会统计，普通超市备有约4.4万种不同的商品，许多超市拥有的商品数量甚至比这还要多出数万种。`,
        points: ["The average supermarket（普通/平均规模的超市）", "carries some 44,000 items（上架/备有约4.4万种商品，some 表大约）", "tens of thousands more（多出数万种）"],
        pitfalls: ["carries 在商业零售语境下表示“上架销售/备货”，some 修饰数字表示“大约”"]
      },
      {
        id: "s5",
        text: `The sheer volume of available choice is enough to send shoppers into a state of information overload.`,
        refZh: `单单是可供选择的庞大数量，就足以让购物者陷入信息过载的状态。`,
        points: ["sheer volume（庞大的数量/单单是数量）", "available choice（可供选择的商品）", "send... into a state of...（使……陷入某种状态）", "information overload（信息过载/信息超载）"],
        pitfalls: ["sheer 起强调作用，意为“单单是/纯粹的”，information overload 为现代常用专有名词"]
      },
      {
        id: "s6",
        text: `According to brain-scan experiments, the demands of so much decision-making quickly become too much for us.`,
        refZh: `大脑扫描实验表明，做出如此多决定的要求很快就会让我们不堪重负。`,
        points: ["brain-scan experiments（大脑扫描实验）", "demands of decision-making（做决定的负荷/要求）", "too much for us（让我们难以承受/不堪重负）"],
        pitfalls: ["become too much for us 意为“令人无法招架/不堪重负”，避免字面直译为“对我们太多了”"]
      },
      {
        id: "s7",
        text: `After about 40 minutes of shopping, most people stop struggling to be rationally selective, and instead begin shopping emotionally – which is the point at which we accumulate the 50 percent of stuff in our cart that we never intended buying.`,
        refZh: `在购物约40分钟后，大多数人便不再费力去进行理性的挑选，转而开始进行感性消费——正是在这个时候，我们购物车里累积了多达50%原本从未打算购买的商品。`,
        points: ["rationally selective（理性挑选）", "shopping emotionally（冲动消费/感性购物）", "which is the point at which... 定语从句", "never intended buying 定语从句修饰 stuff"],
        pitfalls: ["stop struggling to be 表示“放弃努力/不再费力去做”，which is the point at which 引导时间/阶段的修饰定语从句"]
      }
    ]
  },
  2017: {
    year: 2017,
    source: `My dream has always been to work somewhere in an area between fashion and publishing. Two years before graduating from secondary school, I took a sewing and design course thinking that I would move on to a fashion design course. However, during that course I realized I was not good enough in this area to compete with other creative personalities in the future, so I decided that it was not the right path for me.

Before applying for university I told everyone that I would study journalism, because writing was, and still is, one of my favourite activities. But, to be honest, I said it, because I thought that fashion and I together were just a dream – I knew that no one could imagine me in the fashion industry at all! So I decided to look for some fashion-related courses that included writing. This is when I noticed the course "Fashion Media & Promotion."`,
    refZh: `我的梦想一直是在时尚界与出版界交叉的某个领域工作。在中学毕业前两年，我参加了一门缝纫与设计课程，想着自己以后能继续攻读服装设计专业。然而，在那门课程的学习期间，我意识到自己在这一领域还不够优秀，未来无法与其他具有创造力的人才竞争，因此我认为这并不是一条适合我的道路。

在申请大学之前，我告诉所有人自己想学新闻学，因为写作曾经是、现在也依然是我最喜欢的活动之一。但坦白说，我之所以这么说，是因为我觉得时尚于我而言只是一场梦——我知道根本没有人能想象我会进入时尚行业！因此，我决定寻找一些涵盖写作内容的时尚相关课程。就在这时，我注意到了“时尚传媒与推广”这门课程。`,
    slices: [
      {
        id: "s1",
        text: `My dream has always been to work somewhere in an area between fashion and publishing.`,
        refZh: `我的梦想一直是在时尚界与出版界交叉的某个领域工作。`,
        points: ["in an area between fashion and publishing（在时尚与出版之间的交叉领域）"],
        pitfalls: ["somewhere in an area 需流畅译出“跨界/交叉领域”之意"]
      },
      {
        id: "s2",
        text: `Two years before graduating from secondary school, I took a sewing and design course thinking that I would move on to a fashion design course.`,
        refZh: `在中学毕业前两年，我参加了一门缝纫与设计课程，想着自己以后能继续攻读服装设计专业。`,
        points: ["secondary school（中学）", "sewing and design course（缝纫与设计课程）", "thinking that... 现在分词作伴随状语（想着……）", "move on to（进而攻读/升学至）"],
        pitfalls: ["thinking that 引导伴随心理活动，需自然顺译"]
      },
      {
        id: "s3",
        text: `However, during that course I realized I was not good enough in this area to compete with other creative personalities in the future, so I decided that it was not the right path for me.`,
        refZh: `然而，在那门课程的学习期间，我意识到自己在这一领域还不够优秀，未来无法与其他具有创造力的人才竞争，因此我认为这并不是一条适合我的道路。`,
        points: ["compete with other creative personalities（与其他具有创意的人才竞争）", "the right path for me（适合我的道路）"],
        pitfalls: ["creative personalities 此处指有创意、有创造才能的人（人才）"]
      },
      {
        id: "s4",
        text: `Before applying for university I told everyone that I would study journalism, because writing was, and still is, one of my favourite activities.`,
        refZh: `在申请大学之前，我告诉所有人自己想学新闻学，因为写作曾经是、现在也依然是我最喜欢的活动之一。`,
        points: ["applying for university（申请大学）", "journalism（新闻学）", "was, and still is（过去是，现在依然是）"],
        pitfalls: ["was, and still is 需译出时态对比：“过去是、现在也依然是”"]
      },
      {
        id: "s5",
        text: `But, to be honest, I said it, because I thought that fashion and I together were just a dream – I knew that no one could imagine me in the fashion industry at all!`,
        refZh: `但坦白说，我之所以这么说，是因为我觉得时尚于我而言只是一场梦——我知道根本没有人能想象我会进入时尚行业！`,
        points: ["to be honest（说实话/坦白讲）", "fashion and I together were just a dream（时尚与我结合只是梦想/我涉足时尚纯属痴人说梦）", "at all 强调否定（根本/完全）"],
        pitfalls: ["fashion and I together 意译为“我与时尚无缘/我涉足时尚只是空想”"]
      },
      {
        id: "s6",
        text: `So I decided to look for some fashion-related courses that included writing.`,
        refZh: `因此，我决定寻找一些涵盖写作内容的时尚相关课程。`,
        points: ["fashion-related courses（时尚相关的课程）", "that included writing 定语从句（包含写作的）"],
        pitfalls: ["定语从句前置翻译符合汉语习惯"]
      },
      {
        id: "s7",
        text: `This is when I noticed the course "Fashion Media & Promotion."`,
        refZh: `就在这时，我注意到了“时尚传媒与推广”这门课程。`,
        points: ["This is when...（正是在此时/就在这时）", "Fashion Media & Promotion（时尚传媒与推广/时尚媒体与营销）"],
        pitfalls: ["This is when... 表语从句需译为“正是在这个时候……”"]
      }
    ]
  },
  2018: {
    year: 2018,
    source: `A fifth grader gets a homework assignment to select his future career path from a list of options. He blinks nervously, looking at the possibilities on the list. He doesn't want to choose only one – he wants to be a computer programmer, a scientist, a musician and numerous other things along the way.

He thinks that if he reads enough books, he can explore as many career paths as he likes. And so he reads – everything from encyclopedias to science fiction novels. He reads so passionately that his parents have to institute a "no reading policy" at the dinner table.

That boy was Bill Gates, and he hasn't stopped reading yet – not even after becoming one of the most successful people on the planet. Nowadays, his reading material has changed from science fiction and reference books: recently, he revealed that he reads at least 50 nonfiction books a year. Gates chooses nonfiction titles because they explain how the world works. "Each book opens up new avenues of knowledge to explore," Gates says.`,
    refZh: `一个五年级学生领到了一项家庭作业：从一份选项清单中选择自己未来的职业道路。他紧张地眨着眼睛，看着清单上的种种可能。他不想只选一个——他想成为一名计算机程序员、一名科学家、一名音乐家，以及在此过程中尝试无数其他职业。

他认为，只要自己读足够多的书，就能随心所欲地探索尽可能多的职业道路。于是他博览群书——从百科全书到科幻小说，无所不读。他读书是如此痴迷，以至于他的父母不得不立下餐桌上“不准看书”的规矩。

那个男孩就是比尔·盖茨，而他至今仍未停止阅读——哪怕是在成为这个星球上最成功的人士之一后也依然如此。如今，他的阅读材料已经不再局限于科幻小说和参考书：最近他透露，自己每年至少读50本非虚构类书籍。盖茨之所以选择非虚构类书目，是因为它们解释了世界的运转规律。“每一本书都开启了探索知识的新途径，”盖茨说。`,
    slices: [
      {
        id: "s1",
        text: `A fifth grader gets a homework assignment to select his future career path from a list of options.`,
        refZh: `一个五年级学生领到了一项家庭作业：从一份选项清单中选择自己未来的职业道路。`,
        points: ["fifth grader（五年级学生）", "homework assignment（家庭作业）", "career path（职业道路）"],
        pitfalls: ["to select 不定式作后置定语修饰 assignment"]
      },
      {
        id: "s2",
        text: `He blinks nervously, looking at the possibilities on the list.`,
        refZh: `他紧张地眨着眼睛，看着清单上的种种可能。`,
        points: ["blinks nervously（紧张地眨眼）", "looking at... 分词短语作伴随状语", "possibilities（可能性/选项）"],
        pitfalls: ["looking at 分词作伴随动作顺译"]
      },
      {
        id: "s3",
        text: `He doesn't want to choose only one – he wants to be a computer programmer, a scientist, a musician and numerous other things along the way.`,
        refZh: `他不想只选一个——他想成为一名计算机程序员、一名科学家、一名音乐家，以及在此过程中尝试无数其他职业。`,
        points: ["computer programmer（程序员）", "numerous other things（无数其他身份/事情）", "along the way（在此过程中/一路走来）"],
        pitfalls: ["things 此处指各种职业身份与追求"]
      },
      {
        id: "s4",
        text: `He thinks that if he reads enough books, he can explore as many career paths as he likes.`,
        refZh: `他认为，只要自己读足够多的书，就能随心所欲地探索尽可能多的职业道路。`,
        points: ["as many... as he likes（尽可能多的……/随心所欲地）", "explore career paths（探索职业路径）"],
        pitfalls: ["as... as 结构的准确翻译"]
      },
      {
        id: "s5",
        text: `And so he reads – everything from encyclopedias to science fiction novels.`,
        refZh: `于是他博览群书——从百科全书到科幻小说，无所不读。`,
        points: ["encyclopedias（百科全书）", "science fiction novels（科幻小说）", "from... to...（从……到……）"],
        pitfalls: ["everything from... to... 译为“从……到……包罗万象/无所不读”"]
      },
      {
        id: "s6",
        text: `He reads so passionately that his parents have to institute a "no reading policy" at the dinner table.`,
        refZh: `他读书是如此痴迷，以至于他的父母不得不立下餐桌上“不准看书”的规矩。`,
        points: ["passionately（热情地/痴迷地）", "so... that...（如此……以至于）", "institute a policy（确立一项规定/规矩）", "at the dinner table（在餐桌上）"],
        pitfalls: ["institute 此处作动词，意为“制定、实施”"]
      },
      {
        id: "s7",
        text: `That boy was Bill Gates, and he hasn't stopped reading yet – not even after becoming one of the most successful people on the planet.`,
        refZh: `那个男孩就是比尔·盖茨，而他至今仍未停止阅读——哪怕是在成为这个星球上最成功的人士之一后也依然如此。`,
        points: ["hasn't stopped reading yet（至今仍未停止阅读）", "not even after...（甚至在……之后也没有）", "on the planet（在地球上/这个星球上）"],
        pitfalls: ["not even after 是强烈的让步强调结构"]
      },
      {
        id: "s8",
        text: `Nowadays, his reading material has changed from science fiction and reference books: recently, he revealed that he reads at least 50 nonfiction books a year.`,
        refZh: `如今，他的阅读材料已经不再局限于科幻小说和参考书：最近他透露，自己每年至少读50本非虚构类书籍。`,
        points: ["reading material（阅读材料）", "nonfiction books（非虚构类书籍）", "at least（至少）"],
        pitfalls: ["nonfiction 准确译为“非虚构类”作品"]
      },
      {
        id: "s9",
        text: `Gates chooses nonfiction titles because they explain how the world works. "Each book opens up new avenues of knowledge to explore," Gates says.`,
        refZh: `盖茨之所以选择非虚构类书目，是因为它们解释了世界的运转规律。“每一本书都开启了探索知识的新途径，”盖茨说。`,
        points: ["nonfiction titles（非虚构类书目）", "how the world works（世界如何运转）", "opens up new avenues of knowledge（开辟知识的新途径）"],
        pitfalls: ["titles 此处指“书目/图书”，avenues 原义为林荫道，引申为“途径/渠道”"]
      }
    ]
  },
  2019: {
    year: 2019,
    source: `It is easy to underestimate English writer James Herriot. He had such a pleasant, readable style that one might think that anyone could imitate it. How many times have I heard people say, "I could write a book. I just haven't the time." Easily said. Not so easily done.

James Herriot, contrary to popular opinion, did not find it easy in his early days of, as he put it, "having a go at the writing game". While he obviously had an abundance of natural talent, the final, polished work that he gave to the world was the result of years of practicing, re-writing and reading. Like the majority of authors, he had to suffer many disappointments and rejections along the way, but these made him all the more determined to succeed. Everything he achieved in life was earned the hard way and his success in the literary field was no exception.`,
    refZh: `人们很容易低估英国作家詹姆斯·赫里奥特。他的写作风格如此亲切宜人、通俗易懂，以至于人们可能会认为任何人都能模仿它。多少次我听到人们说：“我也能写书，我只是没时间罢了。”说来容易，做来却不那么容易。

与普遍看法相反，詹姆斯·赫里奥特在他早期涉足他所谓“写作业这门行当”时，发现一切并不轻松。尽管他显然拥有丰富的与生俱来的天赋，但他奉献给世界的最终精雕细琢的作品，却是多年练习、重写和大量阅读的成果。像大多数作者一样，他在一路走来中不得不承受诸多失望和被拒，但这些反而让他更加坚定了成功的决心。他在生活中所取得的一切成就都是通过艰苦奋斗得来的，他在文学领域的成功也毫不例外。`,
    slices: [
      {
        id: "s1",
        text: `It is easy to underestimate English writer James Herriot.`,
        refZh: `人们很容易低估英国作家詹姆斯·赫里奥特。`,
        points: ["underestimate（低估）", "It is easy to do... 形式主语结构"],
        pitfalls: ["It is easy to underestimate 句型中 It 为形式主语"]
      },
      {
        id: "s2",
        text: `He had such a pleasant, readable style that one might think that anyone could imitate it.`,
        refZh: `他的写作风格如此亲切宜人、通俗易懂，以至于人们可能会认为任何人都能模仿它。`,
        points: ["such... that...（如此……以至于）", "pleasant, readable style（亲切宜人、通俗易懂的风格）", "imitate（模仿）"],
        pitfalls: ["such a... that 结果状语从句与双层宾语从句的顺畅转换"]
      },
      {
        id: "s3",
        text: `How many times have I heard people say, "I could write a book. I just haven't the time."`,
        refZh: `多少次我听到人们说：“我也能写书，我只是没时间罢了。”`,
        points: ["How many times（多少次，感叹/强调）", "haven't the time（没有时间）"],
        pitfalls: ["I just haven't the time 为英式习惯表达，等同于 I just don't have the time"]
      },
      {
        id: "s4",
        text: `Easily said. Not so easily done.`,
        refZh: `说来容易，做来却不那么容易。`,
        points: ["Easily said. Not so easily done.（说来容易做来难）"],
        pitfalls: ["对应中文成语“说时容易做时难/说来容易做来难”，注意对称工整"]
      },
      {
        id: "s5",
        text: `James Herriot, contrary to popular opinion, did not find it easy in his early days of, as he put it, "having a go at the writing game".`,
        refZh: `与普遍看法相反，詹姆斯·赫里奥特在他早期涉足他所谓“写作业这门行当”时，发现一切并不轻松。`,
        points: ["contrary to popular opinion（与普遍观点相反）", "as he put it（正如他所言，插入语）", "having a go at（尝试/试水）", "the writing game（写作行当/写作竞赛）"],
        pitfalls: ["having a go at 为口语化习语，意为“尝试/试一下”"]
      },
      {
        id: "s6",
        text: `While he obviously had an abundance of natural talent, the final, polished work that he gave to the world was the result of years of practicing, re-writing and reading.`,
        refZh: `尽管他显然拥有丰富的与生俱来的天赋，但他奉献给世界的最终精雕细琢的作品，却是多年练习、重写和大量阅读的成果。`,
        points: ["abundance of natural talent（丰富的天赋）", "polished work（精雕细琢/打磨完善的作品）", "the result of years of...（多年……的结果）"],
        pitfalls: ["While 引导让步状语从句（尽管/虽然）"]
      },
      {
        id: "s7",
        text: `Like the majority of authors, he had to suffer many disappointments and rejections along the way, but these made him all the more determined to succeed.`,
        refZh: `像大多数作者一样，他在一路走来中不得不承受诸多失望和被拒，但这些反而让他更加坚定了成功的决心。`,
        points: ["the majority of authors（大多数作者）", "suffer disappointments and rejections（遭受失望与被退稿）", "all the more determined（越发坚决/更加坚定）"],
        pitfalls: ["all the more 是固定强化结构，意为“越发/更加”"]
      },
      {
        id: "s8",
        text: `Everything he achieved in life was earned the hard way and his success in the literary field was no exception.`,
        refZh: `他在生活中所取得的一切成就都是通过艰苦奋斗得来的，他在文学领域的成功也毫不例外。`,
        points: ["earned the hard way（历经千辛万苦得来/通过艰苦奋斗获得）", "literary field（文学领域）", "no exception（绝不例外）"],
        pitfalls: ["earned the hard way 是固定习语，指克服重重困难、通过辛苦努力而获得"]
      }
    ]
  },
  2020: {
    year: 2020,
    source: `It's almost impossible to go through life without experiencing some kind of failure. But, the wonderful thing about failure is that it's entirely up to us to decide how to look at it.

We can choose to see failure as "the end of the world". Or, we can look at failure as the incredible learning experience that it often is. Every time we fail at something, we can choose to look for the lesson we're meant to learn. These lessons are very important; they're how we grow, and how we keep from making that same mistake again. Failures stop us only if we let them.

Failure can also teach us things about ourselves that we would never have learned otherwise. For instance, failure can help you discover how strong a person you are. Failing at something can help you discover your truest friends, or help you find unexpected motivation to succeed.`,
    refZh: `人的一生中几乎不可能不经历某种失败。但是，失败的美妙之处在于，完全由我们自己来决定如何看待它。

我们可以选择把失败看作“世界末日”。或者，我们也可以把失败看作一堂极佳的学习体验课——而它往往正是如此。每次我们在某件事上失败时，我们都可以选择去寻找我们应当汲取的教训。这些教训至关重要；它们是我们成长的途径，也是防止我们重蹈覆辙的方法。唯有当我们听之任之，失败才会阻碍我们的前行。

失败还可以让我们了解关于自身的那些非经失败绝不可能学到的品质。例如，失败能帮助你发现自己是一个多么坚强的人。在某些事情上的挫败可以帮你认清谁是你最真挚的朋友，或者帮助你找到意想不到的成功动力。`,
    slices: [
      {
        id: "s1",
        text: `It's almost impossible to go through life without experiencing some kind of failure.`,
        refZh: `人的一生中几乎不可能不经历某种失败。`,
        points: ["go through life（度过一生/生活）", "without doing...（不……/没有……）", "双重否定表肯定"],
        pitfalls: ["impossible 与 without 构成双重否定强化肯定语气"]
      },
      {
        id: "s2",
        text: `But, the wonderful thing about failure is that it's entirely up to us to decide how to look at it.`,
        refZh: `但是，失败的美妙之处在于，完全由我们自己来决定如何看待它。`,
        points: ["up to us to decide（取决于我们来决定/由我们决定）", "the wonderful thing about failure 表语从句"],
        pitfalls: ["be up to somebody to do 意为“由某人决定/取决于某人”"]
      },
      {
        id: "s3",
        text: `We can choose to see failure as "the end of the world".`,
        refZh: `我们可以选择把失败看作“世界末日”。`,
        points: ["see... as...（把……看作……）", "the end of the world（世界末日）"],
        pitfalls: ["see A as B 是经典的视作结构"]
      },
      {
        id: "s4",
        text: `Or, we can look at failure as the incredible learning experience that it often is.`,
        refZh: `或者，我们也可以把失败看作一堂极佳的学习体验课——而它往往正是如此。`,
        points: ["incredible learning experience（极佳/难以置信的学习体验）", "that it often is 定语从句"],
        pitfalls: ["that it often is 指代前面提到的属性“事实往往就是如此”"]
      },
      {
        id: "s5",
        text: `Every time we fail at something, we can choose to look for the lesson we're meant to learn.`,
        refZh: `每次我们在某件事上失败时，我们都可以选择去寻找我们应当汲取的教训。`,
        points: ["Every time 引导时间状语从句（每次……）", "fail at something（在某事上失败）", "be meant to learn（应当/注定学习）"],
        pitfalls: ["be meant to do 意为“应该做/注定要做”"]
      },
      {
        id: "s6",
        text: `These lessons are very important; they're how we grow, and how we keep from making that same mistake again.`,
        refZh: `这些教训至关重要；它们是我们成长的途径，也是防止我们重蹈覆辙的方法。`,
        points: ["how we grow 表语从句（我们如何成长）", "keep from doing（避免/防止做某事）", "make the same mistake again（重蹈覆辙）"],
        pitfalls: ["keep from doing sth 意为“阻止/避免做某事”"]
      },
      {
        id: "s7",
        text: `Failures stop us only if we let them.`,
        refZh: `唯有当我们听之任之，失败才会阻碍我们的前行。`,
        points: ["only if 引导条件状语从句（只有当……时）", "stop us（阻碍我们）", "let them（任由它们/放任它们）"],
        pitfalls: ["only if 需译出强烈的必要条件语气：“只有当我们允许时，失败才会阻碍我们”"]
      },
      {
        id: "s8",
        text: `Failure can also teach us things about ourselves that we would never have learned otherwise.`,
        refZh: `失败还可以让我们了解关于自身的那些非经失败绝不可能学到的品质。`,
        points: ["teach us things about ourselves（让我们了解自身）", "would never have learned otherwise 虚拟语气（否则绝不可能学会）"],
        pitfalls: ["otherwise 表示含蓄条件“否则/若非如此”，结合 would have done 构成对过去的虚拟"]
      },
      {
        id: "s9",
        text: `For instance, failure can help you discover how strong a person you are.`,
        refZh: `例如，失败能帮助你发现自己是一个多么坚强的人。`,
        points: ["For instance（例如）", "how strong a person you are 感叹语序宾语从句"],
        pitfalls: ["how + adj + a + n 结构顺译为“多么……的一个人”"]
      },
      {
        id: "s10",
        text: `Failing at something can help you discover your truest friends, or help you find unexpected motivation to succeed.`,
        refZh: `在某些事情上的挫败可以帮你认清谁是你最真挚的朋友，或者帮助你找到意想不到的成功动力。`,
        points: ["Failing at something 动名词短语作主语", "truest friends（最真挚/最忠实的朋友）", "unexpected motivation（意想不到的动力）"],
        pitfalls: ["动名词作主语译为“在某事上的失败/经历挫折”"]
      }
    ]
  },
  2021: {
    year: 2021,
    source: `We tend to think that friends and family members are our biggest sources of connection, laughter, and warmth. While that may well be true, researchers have also recently found that interacting with strangers actually brings a boost in mood and feelings of belonging that we didn't expect.

In one series of studies, researchers instructed Chicago-area commuters using public transportation to strike up a conversation with someone near them. On average, participants who followed this instruction felt better than those who had been told to stand or sit in silence.

The researchers also argued that when we shy away from casual interactions with strangers, it is often due to a misplaced anxiety that they might not want to talk to us. Much of the time, however, this belief is false. As it turns out, many people are actually perfectly willing to talk – and may even be flattered to receive your attention.`,
    refZh: `我们往往认为，朋友和家人是我们人际联系、欢声笑语和温暖关怀的最大源泉。尽管这很可能是事实，但研究人员最近也发现，与陌生人互动实际上会带来我们未曾料到的情绪提升和归属感。

在一系列研究中，研究人员要求乘坐公共交通工具的芝加哥地区通勤者与身边的某个人搭话。平均而言，遵循这一指示的参与者比那些被告知保持安静站立或坐着的参与者感觉更好。

研究人员还指出，当我们回避与陌生人的日常随意互动时，往往是因为一种错位的不安，担心对方可能不想与我们交谈。然而，大多数时候这种想法是错误的。事实证明，许多人其实非常乐意交谈——甚至可能会因受到你的关注而感到荣幸。`,
    slices: [
      {
        id: "s1",
        text: `We tend to think that friends and family members are our biggest sources of connection, laughter, and warmth.`,
        refZh: `我们往往认为，朋友和家人是我们人际联系、欢声笑语和温暖关怀的最大源泉。`,
        points: ["tend to think that（往往认为……）", "sources of connection, laughter, and warmth（联系、欢笑和温暖的源泉）"],
        pitfalls: ["tend to 表示倾向性，connection 引申为“人际联系/情感连接”"]
      },
      {
        id: "s2",
        text: `While that may well be true, researchers have also recently found that interacting with strangers actually brings a boost in mood and feelings of belonging that we didn't expect.`,
        refZh: `尽管这很可能是事实，但研究人员最近也发现，与陌生人互动实际上会带来我们未曾料到的情绪提升和归属感。`,
        points: ["While that may well be true 让步从句（虽然这很可能是真的）", "interacting with strangers 动名词作主语", "a boost in mood（情绪的提升/改善）", "feelings of belonging（归属感）"],
        pitfalls: ["may well be 意为“极有可能/很有可能”，a boost in mood 译为“心情变好/情绪提升”"]
      },
      {
        id: "s3",
        text: `In one series of studies, researchers instructed Chicago-area commuters using public transportation to strike up a conversation with someone near them.`,
        refZh: `在一系列研究中，研究人员要求乘坐公共交通工具的芝加哥地区通勤者与身边的某个人搭话。`,
        points: ["instructed... to do...（指示/要求某人做某事）", "commuters using public transportation（乘坐公共交通的通勤者）", "strike up a conversation（主动搭话/攀谈）"],
        pitfalls: ["strike up a conversation 是地道固定习语，意为“开始攀谈/主动搭讪”"]
      },
      {
        id: "s4",
        text: `On average, participants who followed this instruction felt better than those who had been told to stand or sit in silence.`,
        refZh: `平均而言，遵循这一指示的参与者比那些被告知保持安静站立或坐着的参与者感觉更好。`,
        points: ["On average（平均而言）", "participants who followed this instruction 定语从句", "in silence（沉默地/安静地）"],
        pitfalls: ["felt better than those who... 比较结构顺译"]
      },
      {
        id: "s5",
        text: `The researchers also argued that when we shy away from casual interactions with strangers, it is often due to a misplaced anxiety that they might not want to talk to us.`,
        refZh: `研究人员还指出，当我们回避与陌生人的日常随意互动时，往往是因为一种错位的不安，担心对方可能不想与我们交谈。`,
        points: ["shy away from（回避/退缩）", "casual interactions（日常交流/偶遇互动）", "misplaced anxiety（错位的焦虑/不必要的担忧）", "that they might not want to... 同位语从句"],
        pitfalls: ["shy away from 意为“回避/退缩”，misplaced anxiety 译为“错位/放错地方的焦虑”"]
      },
      {
        id: "s6",
        text: `Much of the time, however, this belief is false.`,
        refZh: `然而，大多数时候这种想法是错误的。`,
        points: ["Much of the time（大多数时候）", "this belief is false（这种观念/想法是不切实际的/错误的）"],
        pitfalls: ["however 插入语提前翻译"]
      },
      {
        id: "s7",
        text: `As it turns out, many people are actually perfectly willing to talk – and may even be flattered to receive your attention.`,
        refZh: `事实证明，许多人其实非常乐意交谈——甚至可能会因受到你的关注而感到荣幸。`,
        points: ["As it turns out（事实证明/结果表明）", "perfectly willing to talk（非常愿意交谈）", "be flattered to receive your attention（因得到关注而受宠若惊/倍感荣幸）"],
        pitfalls: ["be flattered 准确译出“感到荣幸/受宠若惊”的情感色彩"]
      }
    ]
  },
  2022: {
    year: 2022,
    source: `Although we try our best, sometimes our paintings rarely turn out as originally planned. Changes in the light, the limitations of your painting materials, and the lack of experience and technique mean that what you start out trying to achieve may not come to life the way that you expected. Although this can be frustrating and disappointing, it turns out that this can actually be good for you.

Unexpected results have two benefits: you pretty quickly learn to deal with disappointment and realise that when one door closes, another opens. You also quickly learn to adapt and come up with creative solutions to the problems the painting presents, and thinking outside the box will become your second nature. In fact, creative problem-solving skills are incredibly useful in daily life, with which you're more likely to be able to find a solution when a problem arises.`,
    refZh: `尽管我们竭尽全力，但有时我们的画作很少能如最初设想的那样呈现出来。光线的变化、绘画材料的局限性，以及经验和技巧的欠缺，都意味着你起初试图达成的效果可能无法按照你所期望的那样跃然纸上。虽然这可能会让人感到沮丧和失望，但事实证明这其实对你大有裨益。

意想不到的结果有两大好处：你可以相当迅速地学会应对失望，并意识到当一扇门关上时，另一扇门就会打开。你还会迅速学会适应，并针对绘画中出现的难题提出创造性的解决方案，打破常规的思维方式将成为你的第二天性。事实上，创造性解决问题的技能在日常生活中极其有用，有了这些技能，当遇到问题时你就更有可能找到解决方案。`,
    slices: [
      {
        id: "s1",
        text: `Although we try our best, sometimes our paintings rarely turn out as originally planned.`,
        refZh: `尽管我们竭尽全力，但有时我们的画作很少能如最初设想的那样呈现出来。`,
        points: ["try our best（竭尽全力）", "turn out as originally planned（如最初计划的那样呈现/发展）"],
        pitfalls: ["turn out 意为“结果是/呈现出来”，rarely 表示极少"]
      },
      {
        id: "s2",
        text: `Changes in the light, the limitations of your painting materials, and the lack of experience and technique mean that what you start out trying to achieve may not come to life the way that you expected.`,
        refZh: `光线的变化、绘画材料的局限性，以及经验和技巧的欠缺，都意味着你起初试图达成的效果可能无法按照你所期望的那样跃然纸上。`,
        points: ["limitations of materials（材料的局限）", "lack of experience and technique（缺乏经验和技巧）", "what you start out trying to achieve 主语从句（你起初试图达成的目标）", "come to life（生动呈现/跃然纸上）"],
        pitfalls: ["come to life 是生动短语，在绘画语境中指“栩栩如生地呈现/成真”，切忌直译为“复活”"]
      },
      {
        id: "s3",
        text: `Although this can be frustrating and disappointing, it turns out that this can actually be good for you.`,
        refZh: `虽然这可能会让人感到沮丧和失望，但事实证明这其实对你大有裨益。`,
        points: ["frustrating and disappointing（令人沮丧和失望）", "it turns out that...（事实证明……）", "good for you（对你有好处/大有裨益）"],
        pitfalls: ["it turns out that 为固定句型，引导主语/表语内容"]
      },
      {
        id: "s4",
        text: `Unexpected results have two benefits: you pretty quickly learn to deal with disappointment and realise that when one door closes, another opens.`,
        refZh: `意想不到的结果有两大好处：你可以相当迅速地学会应对失望，并意识到当一扇门关上时，另一扇门就会打开。`,
        points: ["Unexpected results（意想不到的结果）", "deal with disappointment（应对失望）", "when one door closes, another opens（西方谚语：天无绝人之路/失之东隅收之桑榆）"],
        pitfalls: ["when one door closes, another opens 为著名谚语，可直译或结合谚语意译"]
      },
      {
        id: "s5",
        text: `You also quickly learn to adapt and come up with creative solutions to the problems the painting presents, and thinking outside the box will become your second nature.`,
        refZh: `你还会迅速学会适应，并针对绘画中出现的难题提出创造性的解决方案，打破常规的思维方式将成为你的第二天性。`,
        points: ["come up with creative solutions（提出创造性的解决方案）", "the problems the painting presents 定语从句", "thinking outside the box（跳出框框思考/跳出常规思维）", "second nature（第二天性/习以为常）"],
        pitfalls: ["thinking outside the box 为核心成语，意为“打破思维定势/开拓创新思维”"]
      },
      {
        id: "s6",
        text: `In fact, creative problem-solving skills are incredibly useful in daily life, with which you're more likely to be able to find a solution when a problem arises.`,
        refZh: `事实上，创造性解决问题的技能在日常生活中极其有用，有了这些技能，当遇到问题时你就更有可能找到解决方案。`,
        points: ["creative problem-solving skills（创造性解决问题的能力）", "incredibly useful（极其有用）", "with which... 定语从句（凭借这些技能）", "when a problem arises（当问题出现时）"],
        pitfalls: ["介词+关系代词 with which 修饰前面的 skills，需译为“有了这些技能/凭借它们”"]
      }
    ]
  },
  2023: {
    year: 2023,
    source: `In the late 18th century, William Wordsworth became famous for his poems about nature. And he was one of the founders of a movement called Romanticism, which celebrated the wonders of the natural world.

Poetry is powerful. Its energy and rhythm can capture a reader, transport them to another world and make them see things differently. Through carefully selected words and phrases, poems can be dramatic, funny, beautiful, moving and inspiring.

No one knows for sure when poetry began but it has been around for thousands of years, even before people could write. It was a way to tell stories and pass down history. It is closely related to song and even when written it is usually created to be performed out loud. Poems really come to life when they are recited. This can also help with understanding them too, because the rhythm and sounds of the words become clearer.`,
    refZh: `在18世纪末，威廉·华兹华斯因其关于大自然的诗作而闻名。他也是一场名为“浪漫主义”运动的奠基人之一，该运动颂扬了自然界的奇观。

诗歌是充满力量的。它的活力与韵律能够吸引读者，将他们带入另一个世界，并让他们以全新的视角看待事物。通过精心挑选的字词与短语，诗歌可以展现出戏剧性、幽默风趣、优美动人、感人至深以及发人深省的特质。

没有人确切知道诗歌始于何时，但它已经存在了数千年，甚至在人类能够书写之前就已经出现。它是讲述故事和传承历史的一种方式。它与歌曲密切相关，即使被写成文字，它通常也是为了朗诵表演而创作的。当诗歌被朗诵出来时，它们才真正鲜活起来。这也能够帮助人们更好地理解它们，因为诗词的韵律与发音会变得更加清晰。`,
    slices: [
      {
        id: "s1",
        text: `In the late 18th century, William Wordsworth became famous for his poems about nature.`,
        refZh: `在18世纪末，威廉·华兹华斯因其关于大自然的诗作而闻名。`,
        points: ["late 18th century（18世纪晚期/末期）", "became famous for（因……而闻名）", "poems about nature（描写大自然的诗歌）"],
        pitfalls: ["William Wordsworth 准确音译为“威廉·华兹华斯”"]
      },
      {
        id: "s2",
        text: `And he was one of the founders of a movement called Romanticism, which celebrated the wonders of the natural world.`,
        refZh: `他也是一场名为“浪漫主义”运动的奠基人之一，该运动颂扬了自然界的奇观。`,
        points: ["founders of a movement（一场运动的发起者/奠基人）", "Romanticism（浪漫主义）", "celebrated the wonders of the natural world（颂扬大自然的奇迹/奇观）"],
        pitfalls: ["Romanticism 为文学流派专有名词“浪漫主义”，celebrated 此处意为“赞美/颂扬”"]
      },
      {
        id: "s3",
        text: `Poetry is powerful.`,
        refZh: `诗歌是充满力量的。`,
        points: ["Poetry is powerful（诗歌是强有力的/充满力量的）"],
        pitfalls: ["短句翻译注重力量感"]
      },
      {
        id: "s4",
        text: `Its energy and rhythm can capture a reader, transport them to another world and make them see things differently.`,
        refZh: `它的活力与韵律能够吸引读者，将他们带入另一个世界，并让他们以全新的视角看待事物。`,
        points: ["energy and rhythm（能量与节奏/活力与韵律）", "capture a reader（抓住/吸引读者）", "transport them to another world（将他们带入另一个世界）", "see things differently（以不同的视角看待事物）"],
        pitfalls: ["capture 此处引申为“深深吸引/抓住读者”，transport 意为“带领/传送到”"]
      },
      {
        id: "s5",
        text: `Through carefully selected words and phrases, poems can be dramatic, funny, beautiful, moving and inspiring.`,
        refZh: `通过精心挑选的字词与短语，诗歌可以展现出戏剧性、幽默风趣、优美动人、感人至深以及发人深省的特质。`,
        points: ["carefully selected words and phrases（精心挑选的字词与短语）", "dramatic, funny, beautiful, moving and inspiring（富有戏剧性的、幽默的、美丽的、动人的和鼓舞人心的）"],
        pitfalls: ["五个连续形容词需用凝练且富于文采的汉语四字格或对偶词汇顺畅译出"]
      },
      {
        id: "s6",
        text: `No one knows for sure when poetry began but it has been around for thousands of years, even before people could write.`,
        refZh: `没有人确切知道诗歌始于何时，但它已经存在了数千年，甚至在人类能够书写之前就已经出现。`,
        points: ["know for sure（确切知道）", "has been around（早已存在）", "even before people could write（甚至在人类掌握文字之前）"],
        pitfalls: ["has been around 意为“存在/流传”"]
      },
      {
        id: "s7",
        text: `It was a way to tell stories and pass down history.`,
        refZh: `它是讲述故事和传承历史的一种方式。`,
        points: ["pass down history（传承历史）", "tell stories（讲述故事）"],
        pitfalls: ["pass down 准确译为“传授/传承下去”"]
      },
      {
        id: "s8",
        text: `It is closely related to song and even when written it is usually created to be performed out loud.`,
        refZh: `它与歌曲密切相关，即使被写成文字，它通常也是为了朗诵表演而创作的。`,
        points: ["closely related to（与……紧密相关）", "even when written 让步状语从句", "performed out loud（大声朗读/口头吟诵表演）"],
        pitfalls: ["performed out loud 需译出“大声诵读/吟诵演绎”之意"]
      },
      {
        id: "s9",
        text: `Poems really come to life when they are recited.`,
        refZh: `当诗歌被朗诵出来时，它们才真正鲜活起来。`,
        points: ["come to life（焕发生机/变得鲜活）", "recited（被背诵/被朗诵）"],
        pitfalls: ["recited 结合诗歌语境译为“朗诵/吟诵”，come to life 译为“鲜活起来/有了生命力”"]
      },
      {
        id: "s10",
        text: `This can also help with understanding them too, because the rhythm and sounds of the words become clearer.`,
        refZh: `这也能够帮助人们更好地理解它们，因为诗词的韵律与发音会变得更加清晰。`,
        points: ["help with understanding（有助于理解）", "rhythm and sounds of the words（字词的韵律与音韵）"],
        pitfalls: ["sounds of the words 结合诗歌翻译为“语音/音韵”更贴切"]
      }
    ]
  },
  2024: {
    year: 2024,
    source: `With the smell of coffee and fresh bread floating in the air, stalls bursting with colourful vegetables and tempting cheeses, and the buzz of friendly chats, farmers' markets are a feast for the senses. They also provide an opportunity to talk to the people responsible for growing or raising your food, support your local economy and pick up fresh seasonal produce – all at the same time.

Farmers' markets are usually weekly or monthly events, most often with outdoor stalls, which allow farmers or producers to sell their food directly to customers. The size or regularity of markets can vary from season to season, depending on the area's agricultural calendar, and you're likely to find different produce on sale at different times of the year. By cutting out the middlemen, the farmers secure more profit for their produce. Shoppers also benefit from seeing exactly where – and to whom – their money is going.`,
    refZh: `空气中弥漫着咖啡与新鲜面包的香气，摊位上摆满了色彩斑斓的蔬菜和诱人的奶酪，耳边回荡着友善交谈的嗡嗡声，农贸集市堪称一场感官的盛宴。它们还提供了一个绝佳的机会：让你能与负责种植或饲养你食物的人直接对话，支持当地经济，同时还能选购新鲜的时令农产品——这一切都可以兼得。

农贸集市通常是每周或每月举办的活动，大多设有户外摊位，这让农民或生产者能够将他们的食物直接销售给顾客。集市的规模或举办的规律性因季节而异，取决于当地的农事历，而且你很可能在一年中的不同时节发现有不同的农产品在售。通过省去中间商，农民们为他们的农产品争取到了更多利润。购物者也能由此获益，清楚地看到自己的钱究竟流向了何处、流向了谁的腰包。`,
    slices: [
      {
        id: "s1",
        text: `With the smell of coffee and fresh bread floating in the air, stalls bursting with colourful vegetables and tempting cheeses, and the buzz of friendly chats, farmers' markets are a feast for the senses.`,
        refZh: `空气中弥漫着咖啡与新鲜面包的香气，摊位上摆满了色彩斑斓的蔬菜和诱人的奶酪，耳边回荡着友善交谈的嗡嗡声，农贸集市堪称一场感官的盛宴。`,
        points: ["with 复合结构作状语（三个并列伴随要素）", "bursting with（装满/充满）", "buzz of friendly chats（友好攀谈的嗡嗡声/热闹声）", "feast for the senses（感官盛宴）"],
        pitfalls: ["bursting with 形容琳琅满目、堆满商品，feast for the senses 为经典表达“感官盛宴”"]
      },
      {
        id: "s2",
        text: `They also provide an opportunity to talk to the people responsible for growing or raising your food, support your local economy and pick up fresh seasonal produce – all at the same time.`,
        refZh: `它们还提供了一个绝佳的机会：让你能与负责种植或饲养你食物的人直接对话，支持当地经济，同时还能选购新鲜的时令农产品——这一切都可以兼得。`,
        points: ["responsible for growing or raising food（负责种植或饲养食物的人，后置定语）", "support local economy（支持当地经济）", "pick up fresh seasonal produce（选购新鲜时令农产品）", "all at the same time（同时/一举多得）"],
        pitfalls: ["produce 作为名词在此处重音在前，意为“农产品”，而非动词“生产”"]
      },
      {
        id: "s3",
        text: `Farmers' markets are usually weekly or monthly events, most often with outdoor stalls, which allow farmers or producers to sell their food directly to customers.`,
        refZh: `农贸集市通常是每周或每月举办的活动，大多设有户外摊位，这让农民或生产者能够将他们的食物直接销售给顾客。`,
        points: ["weekly or monthly events（每周或每月的活动）", "outdoor stalls（户外摊位）", "which allow... 非限制性定语从句（这使得……）", "sell directly to customers（直接卖给消费者）"],
        pitfalls: ["which 引导定语从句修饰前面的整个集市活动形式，译为“这使农民能够……”"]
      },
      {
        id: "s4",
        text: `The size or regularity of markets can vary from season to season, depending on the area's agricultural calendar, and you're likely to find different produce on sale at different times of the year.`,
        refZh: `集市的规模或举办的规律性因季节而异，取决于当地的农事历，而且你很可能在一年中的不同时节发现有不同的农产品在售。`,
        points: ["vary from season to season（因季节而异/随季节变化）", "agricultural calendar（农事历/农业节律）", "on sale（在售/出售中）"],
        pitfalls: ["agricultural calendar 意为“农时历/农事日历”，on sale 在此处为“在售”而非“打折促销”"]
      },
      {
        id: "s5",
        text: `By cutting out the middlemen, the farmers secure more profit for their produce.`,
        refZh: `通过省去中间商，农民们为他们的农产品争取到了更多利润。`,
        points: ["cutting out the middlemen（剔除/省去中间商）", "secure more profit（锁定/获取更多利润）", "produce（农产品）"],
        pitfalls: ["middlemen 意为“中间商/中介渠道”"]
      },
      {
        id: "s6",
        text: `Shoppers also benefit from seeing exactly where – and to whom – their money is going.`,
        refZh: `购物者也能由此获益，清楚地看到自己的钱究竟流向了何处、流向了谁的腰包。`,
        points: ["benefit from doing（从……中受益）", "where and to whom their money is going 宾语从句（钱花在何处、付给了谁）"],
        pitfalls: ["where and to whom 两个疑问词并列，需准确译出“流向何处以及付给了谁”"]
      }
    ]
  },
  2025: {
    year: 2025,
    source: `You know the moment – the conversation slows, then there's a pause. It's awkward, and so awkward that some people will panic and say anything. Do we all find such silences so stressful?

Researchers analysed the frequency and impact of gaps greater than 2 seconds during conversations, including an overview of previous studies which indicate that the fear of awkward silences can be so extreme that people avoid talking to strangers, even though doing so is likely to be an enjoyable experience.

During conversations with short gaps, people feel more connected to their conversation partners. But such feelings of connection markedly dip when entering a long gap. Long gaps between strangers are likely to be followed by a change in topic. But the opposite seems to be true for conversations between friends. Long gaps there saw increased connection. Between friends, longer gaps seem to provide natural moments for reflection and expression.`,
    refZh: `你肯定经历过那样的时刻——交谈节奏慢了下来，随后出现了一阵停顿。这令人十分尴尬，甚至尴尬到某些人会惊慌失措并口不择言。我们所有人都会觉得这种沉默让人倍感压力吗？

研究人员分析了对话中长于2秒的停顿出现的频率及其影响，其中包括对以往研究的综述，这些研究表明，对尴尬沉默的恐惧可能会极其强烈，以至于人们会避免与陌生人交谈，尽管这样做很可能是一次令人愉悦的体验。

在停顿较短的交谈中，人们会觉得与对话伙伴更有联系。但是，一旦陷入长时间的停顿，这种连结感就会显著下降。陌生人之间的长时间停顿往往随后会导致话题的转换。但在朋友之间的交谈中，情况似乎恰恰相反。朋友之间的长停顿反而见证了连结感的增强。在朋友之间，较长的停顿似乎为思考与表达提供了自然的契机。`,
    slices: [
      {
        id: "s1",
        text: `You know the moment – the conversation slows, then there's a pause.`,
        refZh: `你肯定经历过那样的时刻——交谈节奏慢了下来，随后出现了一阵停顿。`,
        points: ["You know the moment（你懂那种时刻/你经历过那个瞬间）", "conversation slows（对话慢下来）", "pause（暂停/停顿）"],
        pitfalls: ["破折号后为同位语解释，顺译为引人共鸣的场景"]
      },
      {
        id: "s2",
        text: `It's awkward, and so awkward that some people will panic and say anything.`,
        refZh: `这令人十分尴尬，甚至尴尬到某些人会惊慌失措并口不择言。`,
        points: ["so awkward that...（如此尴尬以至于）", "panic and say anything（惊慌失措并胡乱说话/口不择言）"],
        pitfalls: ["say anything 结合语境译为“口不择言/胡乱说些什么来打破沉默”"]
      },
      {
        id: "s3",
        text: `Do we all find such silences so stressful?`,
        refZh: `我们所有人都会觉得这种沉默让人倍感压力吗？`,
        points: ["find + O + adj（觉得某事怎样）", "such silences（这种沉默）", "stressful（令人压力倍增的）"],
        pitfalls: ["疑问句语序转换"]
      },
      {
        id: "s4",
        text: `Researchers analysed the frequency and impact of gaps greater than 2 seconds during conversations, including an overview of previous studies which indicate that the fear of awkward silences can be so extreme that people avoid talking to strangers, even though doing so is likely to be an enjoyable experience.`,
        refZh: `研究人员分析了对话中长于2秒的停顿出现的频率及其影响，其中包括对以往研究的综述，这些研究表明，对尴尬沉默的恐惧可能会极其强烈，以至于人们会避免与陌生人交谈，尽管这样做很可能是一次令人愉悦的体验。`,
        points: ["frequency and impact of gaps（停顿的频率与影响）", "gaps greater than 2 seconds（超过2秒的停顿）", "overview of previous studies（以往研究综述）", "so extreme that...（如此极端以至于）", "even though 让步状语从句"],
        pitfalls: ["长难句拆分：主干为研究人员分析频率与影响，包含分词短语与定语从句，需分层理顺"]
      },
      {
        id: "s5",
        text: `During conversations with short gaps, people feel more connected to their conversation partners.`,
        refZh: `在停顿较短的交谈中，人们会觉得与对话伙伴更有联系。`,
        points: ["conversations with short gaps（停顿较短的对话）", "feel connected to（感到有连结/与……心灵相通）", "conversation partners（谈话伙伴）"],
        pitfalls: ["feel connected to 指人与人之间的心理连结感"]
      },
      {
        id: "s6",
        text: `But such feelings of connection markedly dip when entering a long gap.`,
        refZh: `但是，一旦陷入长时间的停顿，这种连结感就会显著下降。`,
        points: ["feelings of connection（连结感/亲近感）", "markedly dip（显著下降/骤降）", "entering a long gap（进入长时间的停顿）"],
        pitfalls: ["markedly 为副词“明显地/显著地”，dip 意为“下沉/下跌”"]
      },
      {
        id: "s7",
        text: `Long gaps between strangers are likely to be followed by a change in topic.`,
        refZh: `陌生人之间的长时间停顿往往随后会导致话题的转换。`,
        points: ["be followed by（随后发生/紧接着是……）", "a change in topic（转移话题/更换话题）"],
        pitfalls: ["be followed by 需按时间先后译出“……之后往往伴随着话题的转换”"]
      },
      {
        id: "s8",
        text: `But the opposite seems to be true for conversations between friends.`,
        refZh: `但在朋友之间的交谈中，情况似乎恰恰相反。`,
        points: ["the opposite seems to be true（相反的情况似乎成立/情况正好相反）"],
        pitfalls: ["the opposite seems to be true 为地道英语表达，意为“反之亦然/情况恰恰相反”"]
      },
      {
        id: "s9",
        text: `Long gaps there saw increased connection.`,
        refZh: `朋友之间的长停顿反而见证了连结感的增强。`,
        points: ["there 指代朋友间的交谈", "saw拟人化用法（见证了/带来了……）", "increased connection（增强的连结）"],
        pitfalls: ["saw 是英语中经典无生命主语的拟人表达，可译为“见证了”或“带来了连结的加深”"]
      },
      {
        id: "s10",
        text: `Between friends, longer gaps seem to provide natural moments for reflection and expression.`,
        refZh: `在朋友之间，较长的停顿似乎为思考与表达提供了自然的契机。`,
        points: ["natural moments（自然的契机/时刻）", "reflection and expression（沉思与表达/反思与抒发）"],
        pitfalls: ["reflection 指沉淀思考、内省反思"]
      }
    ]
  },
  2026: {
    year: 2026,
    source: `The influence of wearables on psychology refers to how the clothes we wear affect our thoughts, feelings, and behaviors. Clothing is not just about covering our bodies; it plays a significant role in shaping our self-perception and interactions with others.

One aspect of this influence is self-expression. The clothes we choose can reflect our personality, mood, and identity. Whether we opt for bold, colorful outfits or prefer more understated styles, our dress choices convey messages about who we are and how we want to be perceived.

Additionally, clothing can impact our confidence levels. When we wear clothes that make us feel comfortable and confident, it can positively affect our self-esteem and overall mood.

Moreover, cultural and societal influences play a significant role in shaping our dress choices. Different cultures have their norms and expectations regarding dress, which can influence the types of clothing people wear and the meanings attributed to them.`,
    refZh: `服饰对心理的影响是指我们所穿的衣物如何影响我们的思想、感受和行为。服饰不仅仅是为了遮蔽身体，它在塑造我们的自我认知以及与他人的互动方面起着重要作用。

这种影响的一个方面是自我表达。我们选择的衣物能够反映我们的性格、情绪和身份认同。无论我们是选择大胆、色彩鲜艳的服装，还是偏爱更为低调的风格，我们的着装选择都在传达着关于我们是谁以及我们希望被如何看待的信息。

此外，衣着还会影响我们的自信水平。当我们穿上让自己感到舒适和自信的衣服时，它能对我们的自尊和整体情绪产生积极的影响。

再者，文化与社会影响在决定我们的着装选择方面也起着举足轻重的作用。不同的文化对于着装有着各自的规范和期望，这不仅会影响人们所穿衣物的类型，还会影响赋予这些衣物的寓意。`,
    slices: [
      {
        id: "s1",
        text: `The influence of wearables on psychology refers to how the clothes we wear affect our thoughts, feelings, and behaviors.`,
        refZh: `服饰对心理的影响是指我们所穿的衣物如何影响我们的思想、感受和行为。`,
        points: ["influence of wearables on psychology（穿戴/服饰对心理的影响）", "refers to（指的是……）", "how the clothes we wear affect... 宾语从句"],
        pitfalls: ["wearables 在心理学“穿衣认知（Enclothed Cognition）”语境下指所穿戴的衣物服饰"]
      },
      {
        id: "s2",
        text: `Clothing is not just about covering our bodies; it plays a significant role in shaping our self-perception and interactions with others.`,
        refZh: `服饰不仅仅是为了遮蔽身体，它在塑造我们的自我认知以及与他人的互动方面起着重要作用。`,
        points: ["not just about...（不仅仅是关于……）", "play a significant role in doing（在……中发挥重要作用）", "self-perception（自我认知）", "interactions with others（与他人的互动）"],
        pitfalls: ["self-perception 为心理学概念，译为“自我认知/自我审视”"]
      },
      {
        id: "s3",
        text: `One aspect of this influence is self-expression.`,
        refZh: `这种影响的一个方面是自我表达。`,
        points: ["aspect of this influence（这种影响的一个方面）", "self-expression（自我表达）"],
        pitfalls: ["短句直接顺译"]
      },
      {
        id: "s4",
        text: `The clothes we choose can reflect our personality, mood, and identity.`,
        refZh: `我们选择的衣物能够反映我们的性格、情绪和身份认同。`,
        points: ["The clothes we choose 定语从句", "personality, mood, and identity（性格、心情与身份认同）"],
        pitfalls: ["identity 译为“身份/身份认同”"]
      },
      {
        id: "s5",
        text: `Whether we opt for bold, colorful outfits or prefer more understated styles, our dress choices convey messages about who we are and how we want to be perceived.`,
        refZh: `无论我们是选择大胆、色彩鲜艳的服装，还是偏爱更为低调的风格，我们的着装选择都在传达着关于我们是谁以及我们希望被如何看待的信息。`,
        points: ["Whether... or... 让步状语从句（无论是……还是……）", "opt for（选择）", "bold, colorful outfits（大胆张扬、色彩鲜艳的服装）", "understated styles（低调朴素的风格）", "how we want to be perceived（我们希望被如何看待）"],
        pitfalls: ["opt for 意为“选择”，understated 指“低调的、含蓄的”，convey messages 译为“传递信息”"]
      },
      {
        id: "s6",
        text: `Additionally, clothing can impact our confidence levels.`,
        refZh: `此外，衣着还会影响我们的自信水平。`,
        points: ["Additionally（此外）", "confidence levels（自信心水平）"],
        pitfalls: ["简洁准确顺译"]
      },
      {
        id: "s7",
        text: `When we wear clothes that make us feel comfortable and confident, it can positively affect our self-esteem and overall mood.`,
        refZh: `当我们穿上让自己感到舒适和自信的衣服时，它能对我们的自尊和整体情绪产生积极的影响。`,
        points: ["feel comfortable and confident（感到舒适和自信）", "positively affect（产生积极影响）", "self-esteem（自尊心）", "overall mood（整体心境/情绪）"],
        pitfalls: ["self-esteem 译为“自尊/自尊心”"]
      },
      {
        id: "s8",
        text: `Moreover, cultural and societal influences play a significant role in shaping our dress choices.`,
        refZh: `再者，文化与社会影响在决定我们的着装选择方面也起着举足轻重的作用。`,
        points: ["cultural and societal influences（文化和社会影响）", "shaping our dress choices（塑造/影响我们的着装选择）"],
        pitfalls: ["Moreover 表递进“再者/此外”，shape 此处引申为“决定/塑造”"]
      },
      {
        id: "s9",
        text: `Different cultures have their norms and expectations regarding dress, which can influence the types of clothing people wear and the meanings attributed to them.`,
        refZh: `不同的文化对于着装有着各自的规范和期望，这不仅会影响人们所穿衣物的类型，还会影响赋予这些衣物的寓意。`,
        points: ["norms and expectations regarding dress（关于着装的规范与期望）", "which can influence... 非限制性定语从句", "the meanings attributed to them（赋予它们/服饰的意义）"],
        pitfalls: ["attributed to 过去分词短语作后置定语修饰 meanings，意为“被赋予……的含义/寓意”"]
      }
    ]
  }
};

export function writeTranslations() {
  const dirs = ['src/content/translation', 'content/translation'];
  dirs.forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  Object.entries(allTranslations).forEach(([year, data]) => {
    const jsonStr = JSON.stringify(data, null, 2);
    dirs.forEach(d => {
      fs.writeFileSync(path.join(d, `${year}.json`), jsonStr, 'utf8');
    });
  });

  console.log('All 17 years (2010-2026) translations written successfully!');
}

writeTranslations();
