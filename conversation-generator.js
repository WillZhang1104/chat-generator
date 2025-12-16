// 对话生成器主逻辑

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 监听交易目的多选变化
    document.querySelectorAll('input[name="transactionPurpose"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const customPurposeGroup = document.getElementById('customPurposeGroup');
            const otherChecked = document.getElementById('purpose_other').checked;
            customPurposeGroup.style.display = otherChecked ? 'block' : 'none';
        });
    });

    // 监听平台变化，显示/隐藏邮件配置
    const platformSelect = document.getElementById('platform');
    if (platformSelect) {
        platformSelect.addEventListener('change', function() {
            const emailConfigGroup = document.getElementById('emailConfigGroup');
            emailConfigGroup.style.display = this.value === 'email' ? 'block' : 'none';
        });
    }

    // 编辑对话功能
    const editBtn = document.getElementById('editConversationBtn');
    const saveBtn = document.getElementById('saveConversationBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const addMsgBtn = document.getElementById('addMessageBtn');
    
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            if (currentPlatform === 'email' && currentEmails) {
                // 邮件编辑
                showEditableEmail(currentEmails);
                editBtn.style.display = 'none';
                saveBtn.style.display = 'inline-block';
                cancelBtn.style.display = 'inline-block';
                addMsgBtn.style.display = 'inline-block';
                document.getElementById('conversationEditArea').style.display = 'block';
            } else if (currentConversation) {
                // 对话编辑
                showEditableConversation(currentConversation);
                editBtn.style.display = 'none';
                saveBtn.style.display = 'inline-block';
                cancelBtn.style.display = 'inline-block';
                addMsgBtn.style.display = 'inline-block';
                document.getElementById('conversationEditArea').style.display = 'block';
            }
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveEditedConversation();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            cancelEdit();
        });
    }
    
    if (addMsgBtn) {
        addMsgBtn.addEventListener('click', function() {
            addNewMessage();
        });
    }

    // 监听表单提交
    const conversationForm = document.getElementById('conversationForm');
    if (conversationForm) {
        conversationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            try {
                await generateConversation();
            } catch (error) {
                console.error('生成对话时出错:', error);
                alert('生成对话时出错: ' + error.message);
            }
            return false;
        });
    }
    
    // 设置对话场景监听器
    setupConversationSceneListeners();
    
    // 监听时间段选择变化
    document.querySelectorAll('input[name="conversationTime"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const customTimeGroup = document.getElementById('customTimeGroup');
            if (customTimeGroup) {
                customTimeGroup.style.display = this.value === 'custom' ? 'block' : 'none';
            }
        });
    });
});

// 监听对话场景变化（在DOMContentLoaded中调用）
function setupConversationSceneListeners() {
    document.querySelectorAll('input[name="conversationScene"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const ageGroup = document.getElementById('ageGroup');
            const willProvideGroup = document.getElementById('willProvideGroup');
            const purposeGroup = document.getElementById('purposeGroup');
            const formMethodGroup = document.getElementById('formMethodGroup');
            const purposeRequired = document.getElementById('purposeRequired');
            
            if (this.value === 'kyc') {
                ageGroup.style.display = 'block';
                willProvideGroup.style.display = 'block';
                purposeGroup.style.display = 'none';
                formMethodGroup.style.display = 'none';
            } else {
                ageGroup.style.display = 'none';
                willProvideGroup.style.display = 'none';
                purposeGroup.style.display = 'block';
                formMethodGroup.style.display = 'block';
            }
        });
    });
}

function clearForm() {
    document.getElementById('conversationForm').reset();
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('customPurposeGroup').style.display = 'none';
    document.getElementById('ageGroup').style.display = 'none';
    document.getElementById('willProvideGroup').style.display = 'none';
    document.getElementById('purposeGroup').style.display = 'block';
    document.getElementById('formMethodGroup').style.display = 'block';
}

async function generateConversation() {
    const customerName = document.getElementById('customerName').value;
    const conversationScene = document.querySelector('input[name="conversationScene"]:checked').value;
    
    if (conversationScene === 'kyc') {
        // 补充材料场景
        const customerAge = parseInt(document.getElementById('customerAge').value);
        if (!customerAge || customerAge < 60) {
            alert('补充材料场景需要客户年龄（必须60岁以上）');
            return;
        }
        
        const willProvideRadio = document.querySelector('input[name="willProvide"]:checked');
        if (!willProvideRadio) {
            alert('请选择客户是否愿意提供材料');
            return;
        }
        
        const willProvide = willProvideRadio.value === 'yes';
        const platform = document.getElementById('platform').value;
        const additionalInfo = document.getElementById('additionalInfo').value;
        
        // 生成补充材料对话
        let conversation = createKYCConversation(customerName, customerAge, platform, additionalInfo, willProvide);
        
        // 如果启用AI优化，则优化对话
        if (shouldUseAIOptimization()) {
            const provider = getAIProvider();
            const apiKey = getAIApiKey();
            if (!apiKey) {
                alert('请先输入 API Key 才能使用 AI 优化功能');
                return;
            }
            
            // 显示加载提示
            const preview = document.getElementById('conversationPreview');
            if (preview) {
                preview.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">正在使用 AI 优化对话，请稍候...</div>';
            }
            
            // 异步优化对话
            try {
                conversation = await optimizeConversationWithAI(conversation, customerName, platform, provider, apiKey);
            } catch (error) {
                console.error('AI优化失败:', error);
                alert('AI优化失败，将使用原始对话。错误：' + error.message);
            }
        }
        
        // 显示预览
        displayConversation(conversation);
        
        // 根据平台生成不同的输出
        if (platform === 'email') {
            const senderEmail = document.getElementById('senderEmail').value;
            if (!senderEmail) {
                alert('邮件场景需要填写寄件人邮箱（客户邮箱）');
                return;
            }
            const customerGreeting = document.getElementById('customerGreeting').value;
            if (!customerGreeting) {
                alert('邮件场景需要填写客户称呼方式');
                return;
            }
            const emailDate = document.getElementById('emailDate').value;
            if (!emailDate) {
                alert('邮件场景需要填写邮件日期');
                return;
            }
            generateEmailHTML(conversation, customerName, senderEmail, null, customerGreeting, emailDate);
            // 显示邮件使用说明
            document.getElementById('whatsappInstructions').style.display = 'none';
            document.getElementById('emailInstructions').style.display = 'block';
        } else {
            generateBrowserScript(conversation, platform);
            // 根据平台显示对应的使用说明
            if (platform === 'telegram') {
                document.getElementById('whatsappInstructions').style.display = 'none';
                document.getElementById('telegramInstructions').style.display = 'block';
                document.getElementById('emailInstructions').style.display = 'none';
            } else {
                document.getElementById('whatsappInstructions').style.display = 'block';
                document.getElementById('telegramInstructions').style.display = 'none';
                document.getElementById('emailInstructions').style.display = 'none';
            }
        }
        
        // 生成合规问题答案
        generateComplianceAnswers(customerName, null, 'kyc');
        
        // 显示预览区域
        document.getElementById('previewSection').style.display = 'block';
        document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth' });
    } else {
        // 初始接触场景
        const checkedPurposes = Array.from(document.querySelectorAll('input[name="transactionPurpose"]:checked')).map(cb => cb.value);
        
        if (checkedPurposes.length === 0) {
            alert('请至少选择一个交易目的');
            return;
        }
        
        const customPurpose = document.getElementById('customPurpose').value;
        const formMethod = document.querySelector('input[name="formMethod"]:checked').value;
        const platform = document.getElementById('platform').value;
        const additionalInfo = document.getElementById('additionalInfo').value;

        // 获取交易目的文本（支持多选）
        const purposeDetails = getPurposeDetails(checkedPurposes, customPurpose);

        // 生成对话
        let conversation = createConversation(customerName, purposeDetails, formMethod, platform, additionalInfo);
        
        // 如果启用AI优化，则优化对话
        if (shouldUseAIOptimization()) {
            const provider = getAIProvider();
            const apiKey = getAIApiKey();
            if (!apiKey) {
                alert('请先输入 API Key 才能使用 AI 优化功能');
                return;
            }
            
            // 显示加载提示
            const preview = document.getElementById('conversationPreview');
            if (preview) {
                preview.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">正在使用 AI 优化对话，请稍候...</div>';
            }
            
            // 异步优化对话
            try {
                conversation = await optimizeConversationWithAI(conversation, customerName, platform, provider, apiKey);
            } catch (error) {
                console.error('AI优化失败:', error);
                alert('AI优化失败，将使用原始对话。错误：' + error.message);
            }
        }
        
        // 显示预览
        displayConversation(conversation);
        
        // 根据平台生成不同的输出
        if (platform === 'email') {
            const senderEmail = document.getElementById('senderEmail').value;
            if (!senderEmail) {
                alert('邮件场景需要填写寄件人邮箱（客户邮箱）');
                return;
            }
            const customerGreeting = document.getElementById('customerGreeting').value;
            if (!customerGreeting) {
                alert('邮件场景需要填写客户称呼方式');
                return;
            }
            const emailDate = document.getElementById('emailDate').value;
            if (!emailDate) {
                alert('邮件场景需要填写邮件日期');
                return;
            }
            generateEmailHTML(conversation, customerName, senderEmail, purposeDetails, customerGreeting, emailDate);
            // 显示邮件使用说明
            document.getElementById('whatsappInstructions').style.display = 'none';
            document.getElementById('emailInstructions').style.display = 'block';
        } else {
            generateBrowserScript(conversation, platform);
            // 根据平台显示对应的使用说明
            if (platform === 'telegram') {
                document.getElementById('whatsappInstructions').style.display = 'none';
                document.getElementById('telegramInstructions').style.display = 'block';
                document.getElementById('emailInstructions').style.display = 'none';
            } else {
                document.getElementById('whatsappInstructions').style.display = 'block';
                document.getElementById('telegramInstructions').style.display = 'none';
                document.getElementById('emailInstructions').style.display = 'none';
            }
        }
        
        // 生成合规问题答案
        generateComplianceAnswers(customerName, purposeDetails, 'initial');
        
        // 显示预览区域
        document.getElementById('previewSection').style.display = 'block';
        document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth' });
    }
}

function getPurposeDetails(checkedPurposes, customPurpose) {
    const purposeMap = {
        'investment': {
            main: 'investment',
            details: [
                'I\'ve been investing in crypto for a while, mostly on Coinbase and Binance',
                'I\'m looking to diversify my portfolio with USDT',
                'I\'ve done some trading on Kraken before',
                'This is my first time getting into crypto investments',
                'I\'ve been investing in stocks and now want to add crypto'
            ]
        },
        'payment': {
            main: 'paying suppliers',
            details: [
                'I need to pay suppliers in Asia, particularly in China and Singapore',
                'We have suppliers in Europe and need a faster payment method',
                'Our suppliers prefer crypto payments for international transactions',
                'We\'re paying vendors in multiple countries',
                'We have trade partners in Southeast Asia'
            ]
        },
        'remittance': {
            main: 'remittance',
            details: [
                'I need to send money to family overseas',
                'Regular remittances to my home country',
                'Sending funds to business partners abroad',
                'Supporting family members in different countries'
            ]
        },
        'trading': {
            main: 'trading',
            details: [
                'I\'m an active crypto trader',
                'I trade on multiple exchanges and need USDT',
                'I do arbitrage trading between exchanges',
                'I\'m a day trader looking for better liquidity'
            ]
        },
        'other': {
            main: customPurpose || 'other purposes',
            details: []
        }
    };
    
    const purposes = checkedPurposes.map(p => purposeMap[p] || purposeMap['other']);
    return purposes;
}

// 根据客户名称生成对话风格（确保同一客户每次生成相同风格）
function getConversationStyle(customerName) {
    // 使用客户名称的哈希值来确定风格，确保同一客户总是得到相同的风格
    let hash = 0;
    for (let i = 0; i < customerName.length; i++) {
        hash = ((hash << 5) - hash) + customerName.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // 增加更多风格选项，让不同客户有更多变化
    const styles = [
        'verbose', 'concise', 'cautious', 'urgent', 'friendly', 'professional',
        'detailed', 'casual', 'formal', 'inquisitive', 'straightforward', 'elaborate'
    ];
    const styleIndex = Math.abs(hash) % styles.length;
    return styles[styleIndex];
}

// 根据客户名称生成变体索引（用于选择同一风格下的不同变体）
function getConversationVariant(customerName) {
    // 使用不同的哈希算法来生成变体索引
    let hash = 0;
    for (let i = 0; i < customerName.length; i++) {
        hash = ((hash << 7) - hash) + customerName.charCodeAt(i) * (i + 1);
        hash = hash & hash;
    }
    return Math.abs(hash) % 5; // 每个风格有5个变体（0-4）
}

// 根据客户名称生成随机种子（用于选择随机元素）
function getRandomSeed(customerName) {
    let seed = 0;
    for (let i = 0; i < customerName.length; i++) {
        seed = ((seed << 3) - seed) + customerName.charCodeAt(i) * 17;
        seed = seed & seed;
    }
    return Math.abs(seed);
}

// 基于种子的随机选择（确保同一客户总是选择相同的元素）
function seededChoice(array, seed, index = 0) {
    const combinedSeed = seed + index * 1000;
    return array[combinedSeed % array.length];
}

// 额外的对话元素库（增加变化）
const conversationVariations = {
    greetings: [
        'Hi there!', 'Hello!', 'Hey!', 'Good morning!', 'Good afternoon!', 
        'Hi!', 'Hello there!', 'Hey there!', 'Morning!', 'Afternoon!'
    ],
    acknowledgments: [
        'Got it.', 'Understood.', 'I see.', 'Okay.', 'Alright.', 
        'Sounds good.', 'Perfect.', 'That makes sense.', 'Right.', 'Sure.'
    ],
    customerQuestions: [
        'What are the fees like?',
        'How long does verification take?',
        'What documents do you need?',
        'Is there a minimum deposit?',
        'What payment methods do you accept?',
        'How quickly do transactions process?',
        'Are there any transaction limits?',
        'What security measures do you have?',
        'Do you have customer support?',
        'What makes you different from competitors?',
        'Can I use this for international transfers?',
        'What happens if there\'s a delay?',
        'Do you have insurance coverage?',
        'What are your business hours?',
        'Can I track my transactions?',
        'How do I get started?',
        'What information do you need from me?',
        'Is my information secure?',
        'What currencies do you support?',
        'Can I cancel a transaction?'
    ],
    companyResponses: {
        fees: [
            'Our fees are competitive - typically around 0.5-1% depending on transaction size.',
            'We charge a small fee of 0.5-1% based on the transaction amount.',
            'Fees range from 0.5% to 1% depending on volume.',
            'Our fee structure is transparent - usually 0.5-1% per transaction.'
        ],
        verification: [
            'Verification usually takes 1-2 business days once we receive all your documents.',
            'The verification process typically takes 1-2 business days.',
            'You can expect verification within 1-2 business days after submitting documents.',
            'We usually complete verification within 1-2 business days.'
        ],
        documents: [
            'We\'ll need standard KYC documents - government ID, proof of address, and sometimes bank statements.',
            'Standard documents include government ID, proof of address, and bank statements if needed.',
            'You\'ll need to provide government ID, proof of address, and potentially bank statements.',
            'Required documents include government-issued ID, proof of address, and bank statements when applicable.'
        ],
        limits: [
            'Transaction limits depend on your verification level.',
            'Limits vary based on your account verification status.',
            'We\'ll discuss specific limits after your account is approved.',
            'Limits are determined by your verification level and account type.'
        ],
        processing: [
            'Most transactions process within 24-48 hours after approval.',
            'Transactions typically complete within 24-48 hours.',
            'You can expect transactions to process within 24-48 hours.',
            'Processing time is usually 24-48 hours after approval.'
        ]
    },
    closingPhrases: [
        'Thanks for your time!', 'Appreciate your help!', 'Thanks for answering my questions!',
        'You\'ve been really helpful!', 'Thanks so much!', 'I appreciate it!',
        'Thank you!', 'Much appreciated!', 'Thanks a lot!', 'Really appreciate it!'
    ]
};

// 根据客户名称生成变体索引（用于选择同一风格下的不同变体）
function getConversationVariant(customerName) {
    // 使用不同的哈希算法来生成变体索引
    let hash = 0;
    for (let i = 0; i < customerName.length; i++) {
        hash = ((hash << 7) - hash) + customerName.charCodeAt(i) * (i + 1);
        hash = hash & hash;
    }
    return Math.abs(hash) % 5; // 每个风格有5个变体（0-4）
}

// 根据客户名称生成随机种子（用于选择随机元素）
function getRandomSeed(customerName) {
    let seed = 0;
    for (let i = 0; i < customerName.length; i++) {
        seed = ((seed << 3) - seed) + customerName.charCodeAt(i) * 17;
        seed = seed & seed;
    }
    return Math.abs(seed);
}

// 基于种子的随机选择（确保同一客户总是选择相同的元素）
function seededChoice(array, seed, index = 0) {
    const combinedSeed = seed + index * 1000;
    return array[combinedSeed % array.length];
}

function createConversation(customerName, purposeDetails, formMethod, platform, additionalInfo) {
    const style = getConversationStyle(customerName);
    const conversationStart = getConversationStart(customerName);
    return generateConversationByStyle(customerName, purposeDetails, formMethod, platform, additionalInfo, style, conversationStart);
}

// 创建补充材料场景对话
function createKYCConversation(customerName, customerAge, platform, additionalInfo, willProvide) {
    const style = getConversationStyle(customerName);
    const variant = getConversationVariant(customerName);
    const seed = getRandomSeed(customerName);
    
    return generateKYCConversationByStyle(customerName, customerAge, platform, additionalInfo, style, willProvide, variant, seed);
}

// 根据风格生成KYC补充材料对话
function generateKYCConversationByStyle(customerName, customerAge, platform, additionalInfo, style, willProvide, variant = 0, seed = 0) {
    const conversationTemplates = {
        verbose: generateVerboseKYCConversation,
        concise: generateConciseKYCConversation,
        cautious: generateCautiousKYCConversation,
        urgent: generateUrgentKYCConversation,
        friendly: generateFriendlyKYCConversation,
        professional: generateProfessionalKYCConversation,
        detailed: generateVerboseKYCConversation,
        casual: generateFriendlyKYCConversation,
        formal: generateProfessionalKYCConversation,
        inquisitive: generateVerboseKYCConversation,
        straightforward: generateConciseKYCConversation,
        elaborate: generateVerboseKYCConversation
    };
    
    const generator = conversationTemplates[style] || generateFriendlyKYCConversation;
    return generator(customerName, customerAge, platform, additionalInfo, willProvide, variant, seed);
}

// 生成多样化的对话开头
function getConversationStart(customerName) {
    const starts = [
        'customer_asks',           // 客户主动询问
        'customer_introduces',     // 客户自我介绍并说明目的
        'customer_referral',       // 客户说明从哪里知道我们
        'customer_product_info',   // 客户要求介绍产品
        'customer_direct_purpose'   // 客户直接说明目的
    ];
    
    // 根据客户名称确定开头类型（确保同一客户总是相同开头）
    let hash = 0;
    for (let i = 0; i < customerName.length; i++) {
        hash = ((hash << 5) - hash) + customerName.charCodeAt(i);
        hash = hash & hash;
    }
    
    return starts[Math.abs(hash) % starts.length];
}

// 根据风格生成对话
function generateConversationByStyle(customerName, purposeDetails, formMethod, platform, additionalInfo, style, conversationStart) {
    const conversationTemplates = {
        verbose: generateVerboseConversation,
        concise: generateConciseConversation,
        cautious: generateCautiousConversation,
        urgent: generateUrgentConversation,
        friendly: generateFriendlyConversation,
        professional: generateProfessionalConversation,
        detailed: generateVerboseConversation, // 详细型使用话多型
        casual: generateFriendlyConversation, // 随意型使用友好型
        formal: generateProfessionalConversation, // 正式型使用专业型
        inquisitive: generateVerboseConversation, // 好奇型使用话多型
        straightforward: generateConciseConversation, // 直接型使用简洁型
        elaborate: generateVerboseConversation // 详细阐述型使用话多型
    };
    
    const generator = conversationTemplates[style] || generateFriendlyConversation;
    const variant = getConversationVariant(customerName);
    const seed = getRandomSeed(customerName);
    return generator(customerName, purposeDetails, formMethod, platform, additionalInfo, conversationStart, variant, seed);
}

// 构建目的文本，融入细节
function buildPurposeText(purposeDetails) {
    if (purposeDetails.length === 0) return 'I need it for various purposes.';
    
    const purposes = purposeDetails.map(p => {
        if (p.details && p.details.length > 0) {
            const detail = p.details[Math.floor(Math.random() * p.details.length)];
            return `I'm planning to use it primarily for ${p.main}. ${detail}`;
        }
        return `I'm planning to use it for ${p.main}.`;
    });
    
    if (purposes.length === 1) {
        return purposes[0];
    } else {
        return purposes.slice(0, -1).join(' ') + ' Also, ' + purposes[purposes.length - 1].toLowerCase();
    }
}

// 生成对话开头消息
function generateConversationStart(customerName, purposeDetails, conversationStart) {
    const mainPurpose = purposeDetails[0].main;
    const detail = purposeDetails[0].details && purposeDetails[0].details.length > 0 
        ? purposeDetails[0].details[Math.floor(Math.random() * purposeDetails[0].details.length)]
        : '';
    
    const starts = {
        'customer_asks': `Hi, I'm interested in opening an account for USD to USDT conversion. Can you tell me more about your service?`,
        'customer_introduces': `Hello, I'm ${customerName}. I'm looking for a reliable onramp service to convert USD to USDT. ${detail ? 'Specifically, ' + detail.toLowerCase() + '.' : ''}`,
        'customer_referral': `Hi! A friend recommended your service. I'm looking to convert USD to USDT for ${mainPurpose}. What can you tell me about your platform?`,
        'customer_product_info': `Hi there. I'd like to learn more about your USD to USDT onramp service. Can you provide some information?`,
        'customer_direct_purpose': `Hello, I need to convert USD to USDT for ${mainPurpose}. ${detail ? detail + '. ' : ''}How does your service work?`
    };
    
    return starts[conversationStart] || starts['customer_asks'];
}

// 话多型对话 - 会问很多问题，比较详细
function generateVerboseConversation(customerName, purposeDetails, formMethod, platform, additionalInfo, conversationStart, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    // 使用多样化的开头
    messages.push({
        sender: 'customer',
        text: generateConversationStart(customerName, purposeDetails, conversationStart),
        time: formatTimeWithRange(conversationDate, 9, 15)
    });

    messages.push({
        sender: 'company',
        text: `Hello ${customerName}! Thanks for reaching out. We offer USD to USDT onramp services - essentially you can deposit USD and we'll convert it to USDT for you. What brings you to us today?`,
        time: formatTimeWithRange(conversationDate, 9, 18)
    });

    messages.push({
        sender: 'customer',
        text: `I'm looking to get started with crypto and need a reliable way to convert my USD. I've heard good things about your service. What's the process like?`,
        time: formatTimeWithRange(conversationDate, 9, 22)
    });

    messages.push({
        sender: 'company',
        text: `Great! The process is straightforward. First, we'll need to understand your use case - what will be the primary purpose of your account? This helps us ensure compliance and provide the best service.`,
        time: formatTimeWithRange(conversationDate, 9, 25)
    });

    // 构建目的说明，融入细节
    const purposeText = buildPurposeText(purposeDetails);
    
    // 使用变体和种子来增加变化
    const question1 = seededChoice(conversationVariations.customerQuestions, seed, variant * 2);
    const question2 = seededChoice(conversationVariations.customerQuestions, seed, variant * 2 + 1);
    const response1 = seededChoice(conversationVariations.companyResponses.fees, seed, variant);
    const response2 = seededChoice(conversationVariations.companyResponses.verification, seed, variant);
    
    messages.push({
        sender: 'customer',
        text: `Sure! ${purposeText} I have a few questions though - ${question1.toLowerCase()} And ${question2.toLowerCase()}`,
        time: formatTimeWithRange(conversationDate, 9, 28)
    });

    messages.push({
        sender: 'company',
        text: `Perfect, thanks for that info. ${response1} ${response2}`,
        time: formatTimeWithRange(conversationDate, 9, 31)
    });

    const question3 = seededChoice(conversationVariations.customerQuestions, seed, variant * 3);
    const response3 = seededChoice(conversationVariations.companyResponses.documents, seed, variant);
    
    messages.push({
        sender: 'customer',
        text: `${seededChoice(conversationVariations.acknowledgments, seed, variant)} ${question3.toLowerCase()} And is there a minimum deposit amount?`,
        time: formatTimeWithRange(conversationDate, 9, 35)
    });

    messages.push({
        sender: 'company',
        text: `${response3} No minimum deposit required to get started!`,
        time: formatTimeWithRange(conversationDate, 9, 38)
    });
    
    messages.push({
        sender: 'customer',
        text: `Got it. So what's the next step?`,
        time: formatTimeWithRange(conversationDate, 10, 15)
    });

    messages.push({
        sender: 'company',
        text: `To get started, we'll need you to complete our onboarding form. This collects all the necessary information for account setup and compliance.`,
        time: formatTimeWithRange(conversationDate, 10, 18)
    });
    
    if (formMethod === 'online') {
        messages.push({
            sender: 'company',
            text: `Here's the link to our online onboarding form: https://wsdglobalpay.com/onboarding/ It should take about 10-15 minutes to complete. Let me know if you run into any issues!`,
            time: formatTimeWithRange(conversationDate, 10, 20)
        });
    } else {
        messages.push({
            sender: 'company',
            text: `I've sent the PDF onboarding form to your email. Please complete all sections and send it back as an attachment when you're done.`,
            time: formatTimeWithRange(conversationDate, 10, 20)
        });
    }

    const question4 = seededChoice(conversationVariations.customerQuestions, seed, variant * 4);
    const question5 = seededChoice(conversationVariations.customerQuestions, seed, variant * 4 + 1);
    const response4 = seededChoice(conversationVariations.companyResponses.limits, seed, variant);
    const response5 = seededChoice(conversationVariations.companyResponses.processing, seed, variant);
    
    messages.push({
        sender: 'customer',
        text: `${seededChoice(conversationVariations.acknowledgments, seed, variant * 2)} Let me review everything first. One more thing - ${question4.toLowerCase()} And ${question5.toLowerCase()}`,
        time: formatTimeWithRange(conversationDate, 10, 25)
    });

    messages.push({
        sender: 'company',
        text: `${response4} We accept bank transfers, wire transfers, and ACH transfers.`,
        time: formatTimeWithRange(conversationDate, 10, 28)
    });

    const question6 = seededChoice(conversationVariations.customerQuestions, seed, variant * 5);
    
    messages.push({
        sender: 'customer',
        text: `Great! And ${question6.toLowerCase()}`,
        time: formatTimeWithRange(conversationDate, 10, 32)
    });

    messages.push({
        sender: 'company',
        text: `${response5} For larger amounts, it might take a bit longer for security checks, but we'll keep you updated throughout the process.`,
        time: formatTimeWithRange(conversationDate, 10, 35)
    });

    const closingPhrase = seededChoice(conversationVariations.closingPhrases, seed, variant);
    
    messages.push({
        sender: 'customer',
        text: `Sounds good! Let me think about it and review everything. I'll probably submit the form in the next day or two. ${closingPhrase}`,
        time: formatTimeWithRange(conversationDate, 10, 38)
    });

    messages.push({
        sender: 'company',
        text: `You're welcome! Take your time. Once you submit the form, you'll receive a confirmation email and we'll start the review process. Feel free to reach out if you have any other questions.`,
        time: formatTimeWithRange(conversationDate, 10, 41)
    });

    return messages;
}

// 话少型对话 - 简洁直接，但也要有基本的交流
function generateConciseConversation(customerName, purposeDetails, formMethod, platform, additionalInfo, conversationStart, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    messages.push({
        sender: 'customer',
        text: generateConversationStart(customerName, purposeDetails, conversationStart),
        time: formatTimeWithRange(conversationDate, 11, 30)
    });

    messages.push({
        sender: 'company',
        text: `Hello ${customerName}! We can help with that. What will be the primary purpose of your account?`,
        time: formatTimeWithRange(conversationDate, 11, 32)
    });

    const purposeText = buildPurposeText(purposeDetails);
    messages.push({
        sender: 'customer',
        text: purposeText,
        time: formatTimeWithRange(conversationDate, 11, 35)
    });

    messages.push({
        sender: 'company',
        text: `Understood. What's your typical transaction size?`,
        time: formatTimeWithRange(conversationDate, 11, 37)
    });

    messages.push({
        sender: 'customer',
        text: `Probably around $10k-$20k per transaction.`,
        time: formatTimeWithRange(conversationDate, 11, 40)
    });

    messages.push({
        sender: 'company',
        text: `Got it. For that amount, we'll need standard KYC verification. Should I send you the onboarding form?`,
        time: formatTimeWithRange(conversationDate, 11, 42)
    });
    
    messages.push({
        sender: 'customer',
        text: `Yes please.`,
        time: formatTimeWithRange(conversationDate, 14, 20)
    });
    
    if (formMethod === 'online') {
        messages.push({
            sender: 'company',
            text: `Here's the link: https://wsdglobalpay.com/onboarding/ Let me know once you've submitted it.`,
            time: formatTimeWithRange(day2, 14, 22)
        });
    } else {
        messages.push({
            sender: 'company',
            text: `I've sent the PDF form to your email. Please return it when completed.`,
            time: formatTimeWithRange(day2, 14, 22)
        });
    }

    messages.push({
        sender: 'customer',
        text: `Will do. How long for approval?`,
        time: formatTimeWithRange(day2, 14, 25)
    });

    messages.push({
        sender: 'company',
        text: `Usually 1-2 business days after we receive your completed form.`,
        time: formatTimeWithRange(day2, 14, 27)
    });

    messages.push({
        sender: 'customer',
        text: `Thanks.`,
        time: formatTimeWithRange(day2, 14, 30)
    });

    return messages;
}

// 谨慎型对话 - 会问很多关于安全、合规的问题
function generateCautiousConversation(customerName, purposeDetails, formMethod, platform, additionalInfo, conversationStart, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    messages.push({
        sender: 'customer',
        text: generateConversationStart(customerName, purposeDetails, conversationStart),
        time: formatTimeWithRange(conversationDate, 10, 45)
    });

    messages.push({
        sender: 'company',
        text: `Hello ${customerName}! Absolutely, I'm happy to address your concerns. We take security and compliance very seriously - we're fully licensed and follow all regulatory requirements including KYC/AML. What would you like to know specifically?`,
        time: formatTimeWithRange(conversationDate, 10, 48)
    });

    messages.push({
        sender: 'customer',
        text: `Good to hear. What kind of KYC documentation do you require? And how is my personal information protected?`,
        time: formatTimeWithRange(conversationDate, 10, 52)
    });

    messages.push({
        sender: 'company',
        text: `We require standard KYC documents - government-issued ID, proof of address (utility bill or bank statement), and sometimes source of funds documentation for larger transactions. All data is encrypted using bank-level security and stored in compliance with GDPR and other data protection regulations.`,
        time: formatTimeWithRange(conversationDate, 10, 55)
    });

    messages.push({
        sender: 'customer',
        text: `Okay, that sounds standard. What about transaction security? How do you ensure funds are safe?`,
        time: formatTimeWithRange(conversationDate, 10, 58)
    });

    messages.push({
        sender: 'company',
        text: `We use multi-signature wallets and cold storage for the majority of funds. All transactions are monitored 24/7, and we have insurance coverage. We've never had a security breach.`,
        time: formatTimeWithRange(conversationDate, 11, 2)
    });

    messages.push({
        sender: 'customer',
        text: `That's reassuring. What's the primary purpose you need to know for?`,
        time: formatTimeWithRange(conversationDate, 11, 5)
    });

    messages.push({
        sender: 'company',
        text: `We need to understand the intended use case for compliance purposes - it helps us ensure we're meeting regulatory requirements and providing appropriate service levels. What will you be using the account for?`,
        time: formatTimeWithRange(conversationDate, 11, 8)
    });

    const purposeText = buildPurposeText(purposeDetails);
    messages.push({
        sender: 'customer',
        text: `The purpose is ${purposeText}. Are there any restrictions based on use case?`,
        time: formatTimeWithRange(conversationDate, 11, 12)
    });

    messages.push({
        sender: 'company',
        text: `No restrictions - we support various use cases as long as they're legal and compliant. That use case is perfectly fine with us.`,
        time: formatTimeWithRange(conversationDate, 11, 15)
    });

    
    messages.push({
        sender: 'customer',
        text: `Good. So what's the next step?`,
        time: formatTimeWithRange(day2, 13, 30)
    });
    
    if (formMethod === 'online') {
        messages.push({
            sender: 'company',
            text: `To proceed, please complete our onboarding form: https://wsdglobalpay.com/onboarding/ All security and compliance details are outlined there, and you can review our privacy policy and terms of service.`,
            time: formatTimeWithRange(day2, 13, 33)
        });
    } else {
        messages.push({
            sender: 'company',
            text: `I've emailed you the PDF onboarding form with all security and compliance information, plus our privacy policy. Please review everything carefully and return it when ready.`,
            time: formatTimeWithRange(day2, 13, 33)
        });
    }

    messages.push({
        sender: 'customer',
        text: `Thank you. I'll review everything carefully before submitting. How long does the review process take?`,
        time: formatTimeWithRange(day2, 13, 37)
    });

    messages.push({
        sender: 'company',
        text: `Typically 1-2 business days. Our compliance team reviews each application thoroughly to ensure everything is in order.`,
        time: formatTimeWithRange(day2, 13, 40)
    });

    messages.push({
        sender: 'customer',
        text: `Understood. Let me review everything first and I'll probably submit it by end of week. Thanks for answering all my questions.`,
        time: formatTimeWithRange(day2, 13, 43)
    });

    return messages;
}

// 急切型对话 - 想要快速完成，催促
function generateUrgentConversation(customerName, purposeDetails, formMethod, platform, additionalInfo, conversationStart, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    messages.push({
        sender: 'customer',
        text: generateConversationStart(customerName, purposeDetails, conversationStart),
        time: formatTimeWithRange(conversationDate, 8, 30)
    });

    messages.push({
        sender: 'company',
        text: `Hello ${customerName}! We can expedite the process. What's the primary purpose of your account?`,
        time: formatTimeWithRange(conversationDate, 8, 32)
    });

    const purposeText = buildPurposeText(purposeDetails);
    messages.push({
        sender: 'customer',
        text: `${purposeText} I really need this done today if possible - is that realistic?`,
        time: formatTimeWithRange(conversationDate, 8, 35)
    });

    messages.push({
        sender: 'company',
        text: `I understand the urgency. We can fast-track your application, but we still need to complete KYC verification which typically takes 1-2 business days. If you submit everything today, we can have you approved by tomorrow or the day after.`,
        time: formatTimeWithRange(conversationDate, 8, 38)
    });

    messages.push({
        sender: 'customer',
        text: `Okay, that works. What do I need to do?`,
        time: formatTimeWithRange(conversationDate, 8, 41)
    });

    messages.push({
        sender: 'company',
        text: `Please complete the onboarding form immediately - make sure all information is accurate to avoid delays. We'll prioritize your review once submitted.`,
        time: formatTimeWithRange(conversationDate, 8, 44)
    });

    
    if (formMethod === 'online') {
        messages.push({
            sender: 'company',
            text: `Here's the link: https://wsdglobalpay.com/onboarding/ Submit as soon as possible and we'll review it right away.`,
            time: formatTimeWithRange(day2, 9, 15)
        });
    } else {
        messages.push({
            sender: 'company',
            text: `I've sent the PDF form to your email. Please complete and return it immediately - we're monitoring for your submission.`,
            time: formatTimeWithRange(day2, 9, 15)
        });
    }

    messages.push({
        sender: 'customer',
        text: `Working on it now. What documents do I need ready?`,
        time: formatTimeWithRange(day2, 9, 20)
    });

    messages.push({
        sender: 'company',
        text: `Government ID, proof of address (utility bill or bank statement), and if it's a large transaction, source of funds documentation. Have those ready and you'll be good to go.`,
        time: formatTimeWithRange(day2, 9, 23)
    });

    messages.push({
        sender: 'customer',
        text: `Got it. Almost done with the form.`,
        time: formatTimeWithRange(day2, 9, 35)
    });

    messages.push({
        sender: 'company',
        text: `Perfect! Once you submit, we'll start the review process immediately.`,
        time: formatTimeWithRange(day2, 9, 37)
    });

    messages.push({
        sender: 'customer',
        text: `Done! Submitted. How long until approval?`,
        time: formatTimeWithRange(day2, 9, 45)
    });

    messages.push({
        sender: 'company',
        text: `We'll review it within 24 hours. You'll receive an email notification once approved. If we need any additional information, we'll reach out right away.`,
        time: formatTimeWithRange(day2, 9, 48)
    });

    messages.push({
        sender: 'customer',
        text: `Thanks! Please keep me updated.`,
        time: formatTimeWithRange(day2, 9, 50)
    });

    return messages;
}

// 友好型对话 - 比较礼貌，会闲聊几句
function generateFriendlyConversation(customerName, purposeDetails, formMethod, platform, additionalInfo, conversationStart, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    messages.push({
        sender: 'customer',
        text: generateConversationStart(customerName, purposeDetails, conversationStart),
        time: formatTimeWithRange(conversationDate, 10, 20)
    });

    messages.push({
        sender: 'company',
        text: `Hello ${customerName}! Thank you, same to you! We'd be happy to help you set up an account. What brings you to us today?`,
        time: formatTimeWithRange(conversationDate, 10, 23)
    });

    messages.push({
        sender: 'customer',
        text: `I'm looking to get into crypto and need a reliable way to convert my USD. I've heard good things about your service from a friend.`,
        time: formatTimeWithRange(conversationDate, 10, 26)
    });

    messages.push({
        sender: 'company',
        text: `That's wonderful! We're glad your friend recommended us. We pride ourselves on being reliable and user-friendly. What will be the main purpose of your account?`,
        time: formatTimeWithRange(conversationDate, 10, 29)
    });

    const purposeText = buildPurposeText(purposeDetails);
    messages.push({
        sender: 'customer',
        text: `${purposeText} I'm pretty new to this whole crypto thing, so I'm still learning.`,
        time: formatTimeWithRange(conversationDate, 10, 32)
    });

    messages.push({
        sender: 'company',
        text: `No worries at all! We're here to help. That's a great use case and we support it fully. The process is pretty straightforward - we'll guide you through everything.`,
        time: formatTimeWithRange(conversationDate, 10, 35)
    });

    messages.push({
        sender: 'customer',
        text: `That's reassuring! What's involved in the signup process?`,
        time: formatTimeWithRange(conversationDate, 10, 38)
    });

    messages.push({
        sender: 'company',
        text: `We'll need you to complete our onboarding form - it collects basic info and helps us verify your identity for compliance. Should take about 10-15 minutes.`,
        time: formatTimeWithRange(conversationDate, 10, 41)
    });

    
    messages.push({
        sender: 'customer',
        text: `Sounds manageable! What documents will I need?`,
        time: formatTimeWithRange(day2, 14, 15)
    });

    messages.push({
        sender: 'company',
        text: `Just standard stuff - government ID and proof of address. Nothing complicated!`,
        time: formatTimeWithRange(day2, 14, 18)
    });
    
    if (formMethod === 'online') {
        messages.push({
            sender: 'company',
            text: `You can access the form here: https://wsdglobalpay.com/onboarding/ Let me know if you have any questions while filling it out - I'm here to help!`,
            time: formatTimeWithRange(day2, 14, 20)
        });
    } else {
        messages.push({
            sender: 'company',
            text: `I've sent the PDF form to your email. Feel free to reach out if you need any assistance - don't hesitate to ask!`,
            time: formatTimeWithRange(day2, 14, 20)
        });
    }

    messages.push({
        sender: 'customer',
        text: `Got it. Let me review everything first. How long does approval usually take?`,
        time: formatTimeWithRange(day2, 14, 25)
    });

    messages.push({
        sender: 'company',
        text: `Usually 1-2 business days. We'll send you an email as soon as you're approved!`,
        time: formatTimeWithRange(day2, 14, 28)
    });

    messages.push({
        sender: 'customer',
        text: `Great! Thanks for being so helpful. I'll probably submit it in the next day or two after I look everything over.`,
        time: formatTimeWithRange(day2, 14, 31)
    });

    messages.push({
        sender: 'company',
        text: `You're welcome! We're excited to have you on board. Feel free to reach out anytime if you have questions. Have a great day!`,
        time: formatTimeWithRange(day2, 14, 34)
    });

    return messages;
}

// 专业型对话 - 使用专业术语，比较正式
function generateProfessionalConversation(customerName, purposeDetails, formMethod, platform, additionalInfo, conversationStart, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    messages.push({
        sender: 'customer',
        text: generateConversationStart(customerName, purposeDetails, conversationStart),
        time: formatTimeWithRange(conversationDate, 9, 0)
    });

    messages.push({
        sender: 'company',
        text: `Good morning ${customerName}. We offer USD to USDT onramp services with institutional-grade infrastructure. To proceed with account setup, please specify the intended use case for this account.`,
        time: formatTimeWithRange(conversationDate, 9, 3)
    });

    const purposeText = buildPurposeText(purposeDetails);
    messages.push({
        sender: 'customer',
        text: `The account will be used for ${purposeText}. What are the compliance requirements and what documentation will be needed?`,
        time: formatTimeWithRange(conversationDate, 9, 6)
    });

    messages.push({
        sender: 'company',
        text: `We adhere to all applicable regulatory requirements including KYC/AML procedures. Standard documentation includes government-issued identification, proof of address, and potentially source of funds documentation depending on transaction volume.`,
        time: formatTimeWithRange(conversationDate, 9, 9)
    });

    messages.push({
        sender: 'customer',
        text: `Understood. What are your transaction limits and fee structure?`,
        time: formatTimeWithRange(conversationDate, 9, 12)
    });

    messages.push({
        sender: 'company',
        text: `Transaction limits are tiered based on verification level - we'll provide specific limits upon account approval. Our fee structure is competitive, typically 0.5-1% depending on volume. We can discuss custom rates for larger transactions.`,
        time: formatTimeWithRange(conversationDate, 9, 15)
    });

    messages.push({
        sender: 'customer',
        text: `That's acceptable. What's the typical processing time for transactions?`,
        time: formatTimeWithRange(conversationDate, 9, 18)
    });

    messages.push({
        sender: 'company',
        text: `Most transactions process within 24-48 hours post-approval. For larger amounts, additional compliance checks may extend this slightly, but we maintain transparency throughout the process.`,
        time: formatTimeWithRange(conversationDate, 9, 21)
    });

    
    messages.push({
        sender: 'customer',
        text: `Very well. What's the next step in the onboarding process?`,
        time: formatTimeWithRange(day2, 14, 0)
    });
    
    if (formMethod === 'online') {
        messages.push({
            sender: 'company',
            text: `Please complete the onboarding form at: https://wsdglobalpay.com/onboarding/ Upon submission, our compliance team will review your application and initiate the verification process.`,
            time: formatTimeWithRange(day2, 14, 3)
        });
    } else {
        messages.push({
            sender: 'company',
            text: `I've sent the onboarding form to your registered email address. Please complete all required sections and return it at your earliest convenience. Our compliance team will review upon receipt.`,
            time: formatTimeWithRange(day2, 14, 3)
        });
    }

    messages.push({
        sender: 'customer',
        text: `Understood. What's the expected timeline for account approval?`,
        time: formatTimeWithRange(day2, 14, 6)
    });

    messages.push({
        sender: 'company',
        text: `Typically 1-2 business days after we receive complete documentation. We'll notify you via email upon approval.`,
        time: formatTimeWithRange(day2, 14, 9)
    });

    messages.push({
        sender: 'customer',
        text: `Excellent. I'll review the documentation and likely submit it by end of week.`,
        time: formatTimeWithRange(day2, 14, 12)
    });

    messages.push({
        sender: 'company',
        text: `Perfect. We look forward to working with you. Should you have any questions during the process, please don't hesitate to reach out.`,
        time: formatTimeWithRange(day2, 14, 15)
    });

    return messages;
}

// 生成拒绝提供银行流水的理由
function generateRefusalReason(customerName) {
    const reasons = [
        {
            text: `I'm not comfortable sharing my bank statements. That's very private financial information. Is there another way to verify?`,
            tone: 'privacy'
        },
        {
            text: `I understand the need for verification, but I'm concerned about privacy. Bank statements contain a lot of sensitive information. Can we use an alternative method?`,
            tone: 'privacy_polite'
        },
        {
            text: `This feels like age discrimination to me. Why are you asking for bank statements just because I'm over 60? I've never had to provide this before.`,
            tone: 'discrimination'
        },
        {
            text: `I'm not sure why my age matters here. I've been banking for decades and have excellent credit. This seems unnecessary.`,
            tone: 'discrimination_polite'
        },
        {
            text: `I don't see why you need 2-3 months of bank statements. That's excessive. What are you looking for exactly?`,
            tone: 'questioning'
        },
        {
            text: `My bank statements contain information about other family members and personal expenses. I'm not comfortable sharing that level of detail.`,
            tone: 'family_privacy'
        },
        {
            text: `I've already provided identification and proof of address. Why do you need bank statements on top of that? This seems redundant.`,
            tone: 'redundant'
        },
        {
            text: `I'm concerned about data security. How do you store and protect bank statements? What happens if there's a data breach?`,
            tone: 'security'
        }
    ];
    
    // 根据客户名称选择理由（确保同一客户总是相同理由）
    let hash = 0;
    for (let i = 0; i < customerName.length; i++) {
        hash = ((hash << 5) - hash) + customerName.charCodeAt(i);
        hash = hash & hash;
    }
    
    return reasons[Math.abs(hash) % reasons.length];
}

// 获取对话时间段设置
function getConversationTimeRange() {
    // 优先使用新的日期和时间段输入
    const dateInput = document.getElementById('conversationDate')?.value.trim();
    const timeRangeInput = document.getElementById('conversationTimeRange')?.value.trim();
    
    if (dateInput && timeRangeInput) {
        // 解析日期（格式：月/日，如 12/13）
        const dateMatch = dateInput.match(/^(\d{1,2})\/(\d{1,2})$/);
        // 解析时间段（格式：HH:mm-HH:mm，如 09:00-17:00）
        const timeMatch = timeRangeInput.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
        
        if (dateMatch && timeMatch) {
            const month = parseInt(dateMatch[1]);
            const day = parseInt(dateMatch[2]);
            const startHour = parseInt(timeMatch[1]);
            const startMinute = parseInt(timeMatch[2]);
            const endHour = parseInt(timeMatch[3]);
            const endMinute = parseInt(timeMatch[4]);
            
            // 创建日期对象（使用当前年份）
            const currentYear = new Date().getFullYear();
            const conversationDate = new Date(currentYear, month - 1, day);
            
            return {
                date: conversationDate,
                startHour: startHour,
                startMinute: startMinute,
                endHour: endHour,
                endMinute: endMinute,
                hasCustomDate: true
            };
        }
    }
    
    // 如果没有新输入，尝试使用旧的时间段选择（向后兼容）
    const timeRangeInputOld = document.querySelector('input[name="conversationTime"]:checked');
    if (timeRangeInputOld) {
        const timeRange = timeRangeInputOld.value || 'morning';
        
        if (timeRange === 'custom') {
            const customTime = document.getElementById('customStartTime')?.value;
            if (customTime && customTime.match(/^\d{1,2}:\d{2}$/)) {
                const [hour, minute] = customTime.split(':').map(Number);
                return {
                    startHour: hour,
                    startMinute: minute,
                    range: 'custom'
                };
            }
        }
        
        // 默认时间段
        const ranges = {
            morning: { startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 },
            afternoon: { startHour: 12, startMinute: 0, endHour: 18, endMinute: 0 },
            evening: { startHour: 18, startMinute: 0, endHour: 22, endMinute: 0 }
        };
        
        return ranges[timeRange] || ranges.morning;
    }
    
    // 默认值（早上）
    return { startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 };
}

// 根据时间段调整时间（支持时间递增）
let timeCounter = 0; // 用于跟踪时间递增

function resetTimeCounter() {
    timeCounter = 0;
}

// 根据时间段调整时间
function adjustTimeForRange(baseHour, baseMinute, timeRange) {
    // 如果用户指定了自定义日期和时间段
    if (timeRange.hasCustomDate) {
        const rangeStartMinutes = timeRange.startHour * 60 + timeRange.startMinute;
        const rangeEndMinutes = timeRange.endHour * 60 + timeRange.endMinute;
        const rangeDuration = rangeEndMinutes - rangeStartMinutes;
        
        // 将基础时间映射到选定时间段
        const baseTotalMinutes = baseHour * 60 + baseMinute;
        const baseRangeStart = 8 * 60; // 8:00
        const baseRangeEnd = 22 * 60; // 22:00
        const baseRangeDuration = baseRangeEnd - baseRangeStart;
        
        // 计算比例并映射
        const ratio = Math.max(0, Math.min(1, (baseTotalMinutes - baseRangeStart) / baseRangeDuration));
        let adjustedMinutes = rangeStartMinutes + (ratio * rangeDuration);
        
        // 确保时间递增（每条消息至少间隔2分钟）
        adjustedMinutes = Math.max(adjustedMinutes, rangeStartMinutes + (timeCounter * 2));
        timeCounter++;
        
        // 确保不超过结束时间
        adjustedMinutes = Math.min(adjustedMinutes, rangeEndMinutes);
        
        const adjustedHour = Math.floor(adjustedMinutes / 60);
        const adjustedMinute = adjustedMinutes % 60;
        
        return { hour: adjustedHour, minute: adjustedMinute };
    }
    
    // 旧的自定义时间段逻辑（向后兼容）
    if (timeRange.range === 'custom') {
        const adjustedMinutes = timeRange.startHour * 60 + timeRange.startMinute + (timeCounter * 2);
        timeCounter++;
        return { 
            hour: Math.floor(adjustedMinutes / 60), 
            minute: adjustedMinutes % 60 
        };
    }
    
    // 将基础时间映射到选定时间段
    const baseTotalMinutes = baseHour * 60 + baseMinute;
    const rangeStartMinutes = timeRange.startHour * 60 + timeRange.startMinute;
    const rangeEndMinutes = timeRange.endHour * 60 + timeRange.endMinute;
    const rangeDuration = rangeEndMinutes - rangeStartMinutes;
    
    // 假设基础时间在8:00-22:00范围内，映射到选定时间段
    const baseRangeStart = 8 * 60; // 8:00
    const baseRangeEnd = 22 * 60; // 22:00
    const baseRangeDuration = baseRangeEnd - baseRangeStart;
    
    // 计算比例并映射
    const ratio = Math.max(0, Math.min(1, (baseTotalMinutes - baseRangeStart) / baseRangeDuration));
    let adjustedMinutes = rangeStartMinutes + (ratio * rangeDuration);
    
    // 确保时间递增
    adjustedMinutes = Math.max(adjustedMinutes, rangeStartMinutes + (timeCounter * 2));
    timeCounter++;
    
    // 确保不超过结束时间
    adjustedMinutes = Math.min(adjustedMinutes, rangeEndMinutes);
    
    const adjustedHour = Math.floor(adjustedMinutes / 60);
    const adjustedMinute = adjustedMinutes % 60;
    
    return { hour: adjustedHour, minute: adjustedMinute };
}

function formatTime(date, hour, minute) {
    const d = new Date(date);
    d.setHours(hour, minute, 0);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
}

// 获取对话日期（如果用户指定了自定义日期）
function getConversationDate() {
    const timeRange = getConversationTimeRange();
    if (timeRange.hasCustomDate && timeRange.date) {
        return timeRange.date;
    }
    // 默认使用当前日期
    return new Date();
}

// 格式化时间（带时间段调整）
function formatTimeWithRange(date, baseHour, baseMinute) {
    const timeRange = getConversationTimeRange();
    
    // 如果用户指定了自定义日期和时间段，使用用户指定的日期
    if (timeRange.hasCustomDate && timeRange.date) {
        const adjusted = adjustTimeForRange(baseHour, baseMinute, timeRange);
        return formatTime(timeRange.date, adjusted.hour, adjusted.minute);
    }
    
    // 否则使用传入的日期
    const adjusted = adjustTimeForRange(baseHour, baseMinute, timeRange);
    return formatTime(date, adjusted.hour, adjusted.minute);
}

// 存储当前对话，用于编辑功能
let currentConversation = null;
let currentPlatform = null;
let currentCustomerName = null;
let currentEmails = null; // 存储当前邮件数据
let currentSenderEmail = null;
let currentRecipientEmail = null;
let currentEmailDate = null;
let currentAttachments = [];

function displayConversation(messages) {
    const preview = document.getElementById('conversationPreview');
    preview.innerHTML = '';
    
    // 保存当前对话
    currentConversation = messages;
    const platform = document.getElementById('platform').value;
    currentPlatform = platform;
    currentCustomerName = document.getElementById('customerName').value;
    
    // 如果是邮件平台，显示HTML预览而不是对话气泡
    if (platform === 'email') {
        // 邮件预览会在 generateEmailHTML 中处理
        return;
    }
    
    // 显示编辑按钮（非邮件平台）
    const editBtn = document.getElementById('editConversationBtn');
    if (editBtn) {
        editBtn.style.display = 'inline-block';
    }

    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = msg.text;
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = msg.time;
        
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(time);
        preview.appendChild(messageDiv);
    });
}

function generateBrowserScript(conversation, platform) {
    // 生成可以直接复制粘贴的HTML代码
    const customerName = document.getElementById('customerName').value;
    const htmlMessages = conversation.map((msg, index) => {
        let html = '';
        // 如果是WhatsApp平台，检查是否需要添加间隔
        if (platform === 'whatsapp' && index > 0) {
            const prevMsg = conversation[index - 1];
            // 如果当前消息和上一条消息的发送者不同，添加间隔
            if (prevMsg.sender !== msg.sender) {
                html += '<div style="height: 8px;"></div>\n';
            }
        }
        if (platform === 'telegram') {
            html += generateTelegramMessageHTML(msg, customerName, index, conversation);
        } else {
            html += generateWhatsAppMessageHTML(msg, customerName, index);
        }
        return html;
    }).join('\n');

    // 直接生成HTML代码，不包含注释
    document.getElementById('scriptCode').textContent = htmlMessages;
}

// 生成邮件格式的对话（正式邮件格式，但更自然多样化）
function generateEmailConversation(customerName, purposeDetails, conversationScene, willProvide, customerGreeting, additionalInfo) {
    const emails = [];
    const now = new Date();
    const style = getConversationStyle(customerName); // 根据客户名称确定风格
    const variant = getConversationVariant(customerName); // 获取变体
    const seed = getRandomSeed(customerName); // 获取随机种子
    
    if (conversationScene === 'initial') {
        // 初次接触场景：客户回复邮件 - 根据风格生成不同格式
        // 确保purposeDetails不为空
        if (!purposeDetails || purposeDetails.length === 0) {
            purposeDetails = [{ main: 'various purposes', details: [] }];
        }
        const emailBody = generateInitialEmailByStyle(customerName, purposeDetails, customerGreeting, style, variant, seed, additionalInfo);
        
        emails.push({
            sender: 'customer',
            subject: 'Re: Account Opening Inquiry - USD to USDT',
            body: emailBody,
            date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2天前
        });
        
    } else {
        // 补充材料场景
        if (willProvide) {
            // 愿意提供 - 根据风格生成不同格式的同意邮件
            const emailBody = generateKYCProvisionEmailByStyle(customerName, customerGreeting, style, variant, seed, additionalInfo);
            
            emails.push({
                sender: 'customer',
                subject: 'Re: Enhanced KYC Documentation Request',
                body: emailBody,
                date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1天前
            });
        } else {
            // 不愿意提供 - 根据风格生成不同格式的拒绝邮件
            const emailBody = generateKYCRefusalEmailByStyle(customerName, customerGreeting, style, variant, seed, additionalInfo);
            
            emails.push({
                sender: 'customer',
                subject: 'Re: Enhanced KYC Documentation Request',
                body: emailBody,
                date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1天前
            });
        }
    }
    
    return emails;
}

// 根据风格生成初次接触邮件（多样化，不严格按照问题回答）
function generateInitialEmailByStyle(customerName, purposeDetails, customerGreeting, style, variant = 0, seed = 0) {
    const emailTemplates = {
        verbose: generateVerboseInitialEmail,
        concise: generateConciseInitialEmail,
        cautious: generateCautiousInitialEmail,
        urgent: generateUrgentInitialEmail,
        friendly: generateFriendlyInitialEmail,
        professional: generateProfessionalInitialEmail,
        detailed: generateDetailedInitialEmail,
        casual: generateCasualInitialEmail,
        formal: generateFormalInitialEmail,
        inquisitive: generateInquisitiveInitialEmail,
        straightforward: generateStraightforwardInitialEmail,
        elaborate: generateElaborateInitialEmail
    };
    
    const generator = emailTemplates[style] || generateFriendlyInitialEmail;
    return generator(customerName, purposeDetails, customerGreeting, variant, seed, additionalInfo);
}

// 话多型初次邮件
function generateVerboseInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0, additionalInfo = '') {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `Thank you for reaching out. I wanted to provide you with the information you requested regarding my account opening inquiry.\n\n`;
    
    body += `To answer your questions:\n\n`;
    body += `**Purpose of Transaction:** ${purposeText}\n\n`;
    
    if (purposeDetails.some(p => p.main === 'investment')) {
        body += `I've been investing in crypto for a while now, mostly through Coinbase and Binance. I'm looking to diversify and this account will help me access USDT more efficiently for my investment strategy.\n\n`;
    }
    if (purposeDetails.some(p => p.main === 'payment')) {
        body += `I regularly need to pay suppliers in Asia - mainly China and Singapore. USDT transactions are faster and cheaper than traditional wire transfers, which is why I'm interested in your service.\n\n`;
    }
    
    body += `**Source of Funds:** The funds come from my personal savings and business operations. I've been in business for several years and maintain accounts with major banks. Everything is properly documented and above board.\n\n`;
    
    body += `**Transaction Details:** I'm planning to make transactions monthly, typically around $15k-$40k per transaction. Annual volume would probably be in the $200k-$300k range.\n\n`;
    
    // 融入额外信息
    if (additionalInfo && additionalInfo.trim()) {
        body += `${additionalInfo}\n\n`;
    }
    
    // 使用变体系统选择不同的问题
    const questions = [
        seededChoice(conversationVariations.customerQuestions, seed, variant * 4),
        seededChoice(conversationVariations.customerQuestions, seed, variant * 4 + 1),
        seededChoice(conversationVariations.customerQuestions, seed, variant * 4 + 2),
        seededChoice(conversationVariations.customerQuestions, seed, variant * 4 + 3)
    ];
    
    body += `I have a few questions about your platform:\n\n`;
    questions.forEach((q, i) => {
        body += `- ${q}\n`;
    });
    body += `\n`;
    
    body += `I've already submitted the onboarding form. Let me know if you need anything else!\n\n`;
    body += `Best regards,\n${customerName}`;
    
    return body;
}

// 话少型初次邮件
function generateConciseInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0) {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `Per your request:\n\n`;
    body += `- Purpose: ${purposeText}\n`;
    body += `- Funds from personal savings\n`;
    body += `- Expected volume: ~$150k-$250k annually\n\n`;
    body += `Quick question - what are your transaction fees and processing times?\n\n`;
    body += `Onboarding form submitted.\n\n`;
    body += `Thanks,\n${customerName}`;
    
    return body;
}

// 谨慎型初次邮件
function generateCautiousInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0) {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `Thank you for your email. I understand you need information for compliance purposes. Below are the details:\n\n`;
    
    body += `**Transaction Purpose:** ${purposeText}\n\n`;
    
    body += `**Source of Funds:** Funds originate from my personal savings accumulated over years of employment. I maintain accounts with established financial institutions and all funds are legally obtained.\n\n`;
    
    body += `**Transaction Pattern:** I anticipate monthly transactions ranging from $20,000 to $45,000. Annual volume estimated at $200,000 to $300,000.\n\n`;
    
    body += `Before proceeding, I would like to understand:\n\n`;
    body += `- What are your security protocols and insurance coverage?\n`;
    body += `- How are transaction fees structured?\n`;
    body += `- What is the typical processing time for USD to USDT conversions?\n`;
    body += `- Are there any daily or monthly transaction limits?\n\n`;
    
    body += `I have completed the onboarding documentation. Please let me know if additional information is required.\n\n`;
    body += `Best regards,\n${customerName}`;
    
    return body;
}

// 急切型初次邮件
function generateUrgentInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0) {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `Quick answers to your questions:\n\n`;
    body += `- Purpose: ${purposeText}\n`;
    body += `- Funds from my business/savings\n`;
    body += `- Need to process $20k-$50k monthly\n\n`;
    body += `What are your fees and how fast can transactions go through? I need to get started ASAP.\n\n`;
    body += `Form is submitted. How quickly can we get approved?\n\n`;
    body += `Thanks,\n${customerName}`;
    
    return body;
}

// 友好型初次邮件
function generateFriendlyInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0) {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `Thanks for your email! Happy to provide the information you need.\n\n`;
    
    body += `To answer your questions:\n\n`;
    body += `**Purpose:** ${purposeText}\n\n`;
    
    if (purposeDetails.some(p => p.main === 'investment')) {
        body += `I've been investing in crypto for a few years now - mostly on Coinbase and Binance. Looking to expand my options and your service seems like a good fit.\n\n`;
    }
    
    body += `**Source of Funds:** The money comes from my personal savings. I've been working for a while and have been building up my savings over the years.\n\n`;
    
    body += `**Transaction Info:** I'm planning to do transactions monthly, probably around $15k-$35k each time. So maybe $200k-$300k per year total.\n\n`;
    
    body += `I'm curious about a few things:\n\n`;
    body += `- What are your transaction fees like? I want to make sure it's cost-effective.\n`;
    body += `- How secure is your platform? Do you have insurance?\n`;
    body += `- How long does it usually take for transactions to complete?\n`;
    body += `- Are there any limits on how much I can convert at once?\n\n`;
    
    body += `I've submitted the onboarding form already. Let me know if you need anything else!\n\n`;
    body += `Best regards,\n${customerName}`;
    
    return body;
}

// 专业型初次邮件
function generateProfessionalInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0) {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `Thank you for your email. Please find below the requested information:\n\n`;
    
    body += `**Purpose of Transaction:** ${purposeText}\n\n`;
    
    body += `**Source of Funds:** Funds are derived from personal savings and business operations. All sources are legitimate and properly documented.\n\n`;
    
    body += `**Transaction Parameters:** Expected transaction frequency: monthly. Transaction size: $20,000-$40,000 per transaction. Estimated annual volume: $200,000-$300,000.\n\n`;
    
    body += `I would appreciate clarification on the following:\n\n`;
    body += `- Transaction fee structure and any applicable charges\n`;
    body += `- Security measures and regulatory compliance\n`;
    body += `- Processing timelines for USD to USDT conversions\n`;
    body += `- Transaction limits and account restrictions\n\n`;
    
    body += `The onboarding form has been completed and submitted. I am prepared to provide any additional documentation that may be required.\n\n`;
    body += `Best regards,\n${customerName}`;
    
    return body;
}

// 详细型初次邮件
function generateDetailedInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0) {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `Thank you for your email. I'm providing detailed information regarding my account opening inquiry.\n\n`;
    
    body += `**Purpose of Transaction:**\n${purposeText}\n\n`;
    
    if (purposeDetails.some(p => p.main === 'investment')) {
        body += `I've been actively investing in cryptocurrency for the past 3-4 years. I started with Coinbase and later expanded to Binance and Kraken. I'm looking to diversify my portfolio and your platform seems like a good option for accessing USDT efficiently.\n\n`;
    }
    if (purposeDetails.some(p => p.main === 'payment')) {
        body += `I run a business that requires regular payments to suppliers across Asia, particularly in China, Singapore, and Vietnam. Traditional wire transfers are slow and expensive, so I'm exploring crypto payment solutions.\n\n`;
    }
    
    body += `**Source of Funds:**\nThe funds originate from my personal savings accumulated over 8+ years of employment in the technology sector. I also have business income from my consulting practice. All funds are properly documented and maintained in accounts with major financial institutions.\n\n`;
    
    body += `**Transaction Details:**\nI anticipate making 8-12 transactions per year, with each transaction typically ranging from $25,000 to $50,000. My estimated annual volume would be approximately $250,000 to $400,000.\n\n`;
    
    body += `I have several questions about your platform:\n\n`;
    body += `- What is your fee structure? Are there different rates for different transaction sizes?\n`;
    body += `- How long does it typically take for a USD deposit to be converted to USDT?\n`;
    body += `- What security measures do you have in place? Is there insurance coverage?\n`;
    body += `- Are there daily, weekly, or monthly transaction limits?\n`;
    body += `- What happens if there's a delay or issue with a transaction?\n`;
    body += `- Do you support multiple currencies or just USD to USDT?\n\n`;
    
    body += `I've completed and submitted the onboarding form. I'm looking forward to getting started once my account is approved.\n\n`;
    body += `Best regards,\n${customerName}`;
    
    return body;
}

// 随意型初次邮件
function generateCasualInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0) {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `Thanks for reaching out! Here's the info you asked for:\n\n`;
    
    body += `**Purpose:** ${purposeText}\n\n`;
    
    body += `**Where the money's from:** My savings mostly. I've been working for a while and have some money set aside. Also have some business income.\n\n`;
    
    body += `**How much I'll be using:** Probably around $20k-$40k per transaction, maybe once or twice a month. So probably $200k-$300k per year total.\n\n`;
    
    body += `A few quick questions:\n\n`;
    body += `- What are your fees? Trying to keep costs down.\n`;
    body += `- How fast do transactions go through? Need something reliable.\n`;
    body += `- Is your platform safe? I'm a bit cautious with crypto stuff.\n`;
    body += `- Any limits I should know about?\n\n`;
    
    body += `I've filled out the form. Let me know what's next!\n\n`;
    body += `Thanks,\n${customerName}`;
    
    return body;
}

// 正式型初次邮件
function generateFormalInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0) {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `I am writing in response to your email dated [date] regarding my account opening inquiry. Please find the requested information below.\n\n`;
    
    body += `**Transaction Purpose:**\n${purposeText}\n\n`;
    
    body += `**Source of Funds:**\nThe funds are derived from personal savings accumulated through years of employment and business operations. All financial activities are conducted through established banking institutions and are fully documented.\n\n`;
    
    body += `**Anticipated Transaction Volume:**\nI expect to conduct transactions on a monthly basis, with individual transaction amounts ranging from $25,000 to $45,000. The projected annual volume is approximately $250,000 to $350,000.\n\n`;
    
    body += `I would be grateful if you could provide information regarding:\n\n`;
    body += `- Fee structure and applicable charges\n`;
    body += `- Security protocols and regulatory compliance measures\n`;
    body += `- Standard processing times for transactions\n`;
    body += `- Transaction limits and account restrictions\n\n`;
    
    body += `I have completed the required onboarding documentation and submitted it as requested. Please advise if any additional information is required.\n\n`;
    body += `I look forward to your response.\n\n`;
    body += `Yours sincerely,\n${customerName}`;
    
    return body;
}

// 好奇型初次邮件（会问很多问题）
function generateInquisitiveInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0) {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `Thanks for your email! I'm happy to provide the information you need.\n\n`;
    
    body += `**Purpose:** ${purposeText}\n\n`;
    
    body += `**Source of Funds:** The funds come from my personal savings and business income. Everything is properly documented.\n\n`;
    
    body += `**Transaction Plans:** I'm thinking of doing transactions monthly, probably around $20k-$40k each time. Annual volume would be maybe $250k-$350k.\n\n`;
    
    body += `I have quite a few questions about your platform - hope that's okay:\n\n`;
    body += `- What are your transaction fees? Is it a flat rate or percentage-based?\n`;
    body += `- How secure is your platform? What kind of security measures do you have?\n`;
    body += `- How long does it take for transactions to process? Same day? Next day?\n`;
    body += `- Are there any transaction limits? Daily limits? Monthly limits?\n`;
    body += `- What happens if something goes wrong with a transaction?\n`;
    body += `- Do you have customer support? How can I reach them?\n`;
    body += `- What makes your platform different from competitors?\n`;
    body += `- Are there any restrictions on how I can use the USDT?\n\n`;
    
    body += `I've submitted the onboarding form. Looking forward to learning more about your service!\n\n`;
    body += `Best regards,\n${customerName}`;
    
    return body;
}

// 直接型初次邮件
function generateStraightforwardInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0) {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `Here's the information you requested:\n\n`;
    
    body += `**Purpose:** ${purposeText}\n`;
    body += `**Source:** Personal savings and business income\n`;
    body += `**Volume:** $20k-$40k per transaction, monthly, ~$250k-$300k annually\n\n`;
    
    body += `Questions:\n`;
    body += `- Fees?\n`;
    body += `- Processing time?\n`;
    body += `- Security?\n`;
    body += `- Limits?\n\n`;
    
    body += `Form submitted.\n\n`;
    body += `${customerName}`;
    
    return body;
}

// 详细阐述型初次邮件
function generateElaborateInitialEmail(customerName, purposeDetails, customerGreeting, variant = 0, seed = 0) {
    const purposeText = buildPurposeText(purposeDetails);
    
    let body = `${customerGreeting}\n\n`;
    body += `Thank you for your email. I appreciate the opportunity to provide detailed information regarding my account opening inquiry.\n\n`;
    
    body += `**Purpose of Transaction:**\n${purposeText}\n\n`;
    
    if (purposeDetails.some(p => p.main === 'investment')) {
        body += `I have been actively engaged in cryptocurrency investments for several years. My investment journey began with traditional platforms such as Coinbase, where I initially started with small amounts to familiarize myself with the market. Over time, I expanded to Binance and Kraken, gradually increasing my investment portfolio. I'm now looking to diversify further and your platform appears to offer competitive rates and reliable service for USD to USDT conversions.\n\n`;
    }
    if (purposeDetails.some(p => p.main === 'payment')) {
        body += `My business requires frequent international payments to suppliers located primarily in Asia. We have established relationships with vendors in China, Singapore, Malaysia, and Vietnam. Traditional banking methods, while secure, often involve significant delays and high fees. Cryptocurrency payments offer a more efficient alternative, and USDT has become widely accepted by our suppliers.\n\n`;
    }
    
    body += `**Source of Funds:**\nThe funds I intend to use originate from multiple legitimate sources. Primarily, they come from personal savings accumulated over my 10+ year career in the technology sector. I have been consistently saving a portion of my income and have built a substantial savings account. Additionally, I operate a small consulting business on the side, which generates additional income. All funds are maintained in accounts with reputable financial institutions, including Chase Bank and Bank of America, and are fully documented.\n\n`;
    
    body += `**Transaction Details:**\nBased on my business needs and investment strategy, I anticipate conducting transactions on a regular monthly basis. Each transaction is expected to range from $25,000 to $50,000, depending on market conditions and specific requirements. Over the course of a year, I estimate the total volume to be approximately $300,000 to $450,000.\n\n`;
    
    body += `I would like to understand more about your platform before proceeding:\n\n`;
    body += `- **Fee Structure:** What are your transaction fees? Are they fixed or percentage-based? Are there any discounts for higher volume transactions?\n`;
    body += `- **Security:** What security measures are in place? Do you have insurance coverage? How are funds protected?\n`;
    body += `- **Processing Time:** How long does it typically take for a USD deposit to be converted to USDT? Is it instant, same-day, or next-day?\n`;
    body += `- **Limits:** Are there daily, weekly, or monthly transaction limits? What are the minimum and maximum transaction amounts?\n`;
    body += `- **Support:** What customer support options are available? Response times?\n`;
    body += `- **Regulatory Compliance:** Are you licensed? What jurisdictions do you operate in?\n\n`;
    
    body += `I have completed the onboarding form and submitted all required documentation. I am ready to proceed once my account is approved and I have received answers to my questions.\n\n`;
    body += `Thank you for your time and assistance.\n\n`;
    body += `Best regards,\n${customerName}`;
    
    return body;
}

// 根据风格生成KYC拒绝邮件（多样化）
function generateKYCRefusalEmailByStyle(customerName, customerGreeting, style, variant = 0, seed = 0) {
    const emailTemplates = {
        verbose: generateVerboseKYCRefusalEmail,
        concise: generateConciseKYCRefusalEmail,
        cautious: generateCautiousKYCRefusalEmail,
        urgent: generateUrgentKYCRefusalEmail,
        friendly: generateFriendlyKYCRefusalEmail,
        professional: generateProfessionalKYCRefusalEmail
    };
    
    const generator = emailTemplates[style] || generateFriendlyKYCRefusalEmail;
    return generator(customerName, customerGreeting, variant, seed, additionalInfo);
}

// 根据风格生成KYC同意提供邮件（多样化）
function generateKYCProvisionEmailByStyle(customerName, customerGreeting, style, variant = 0, seed = 0, additionalInfo = '') {
    const emailTemplates = {
        verbose: generateVerboseKYCProvisionEmail,
        concise: generateConciseKYCProvisionEmail,
        cautious: generateCautiousKYCProvisionEmail,
        urgent: generateUrgentKYCProvisionEmail,
        friendly: generateFriendlyKYCProvisionEmail,
        professional: generateProfessionalKYCProvisionEmail
    };
    
    const generator = emailTemplates[style] || generateFriendlyKYCProvisionEmail;
    return generator(customerName, customerGreeting, variant, seed, additionalInfo);
}

// 话多型KYC拒绝邮件
function generateVerboseKYCRefusalEmail(customerName, customerGreeting, variant = 0, seed = 0, additionalInfo = '') {
    const refusalReason = generateRefusalReason(customerName);
    
    let body = `${customerGreeting}\n\n`;
    body += `Thank you for your email regarding the enhanced KYC documentation request.\n\n`;
    
    if (refusalReason.tone.includes('privacy')) {
        body += `I understand the need for compliance, but I have concerns about providing bank statements. These documents contain a lot of sensitive personal information - family expenses, medical payments, charitable donations, and other private matters that aren't really relevant to account verification.\n\n`;
        body += `I've already provided ID, proof of address, and other KYC documents. I feel like bank statements are asking for more than what's necessary, especially since this seems to be based on my age rather than any actual risk factors.\n\n`;
    } else if (refusalReason.tone.includes('discrimination')) {
        body += `I'm concerned that this request appears to be based solely on my age. I've been managing my finances successfully for decades and have never been asked for bank statements before. This feels like age discrimination.\n\n`;
        body += `I've already provided sufficient documentation. The additional requirement seems excessive and potentially discriminatory.\n\n`;
    } else {
        body += refusalReason.text + '\n\n';
        body += `I've already provided comprehensive identification and address verification. I believe these should be sufficient.\n\n`;
    }
    
    body += `I'd be happy to discuss alternative verification methods. Maybe a bank letter confirming account status, or tax returns? There should be ways to verify without requiring full bank statements.\n\n`;
    if (additionalInfo && additionalInfo.trim()) {
        body += `${additionalInfo}\n\n`;
    }
    body += `I hope we can find a solution that works for both of us.\n\n`;
    body += `Best regards,\n${customerName}`;
    
    return body;
}

// 话少型KYC拒绝邮件
function generateConciseKYCRefusalEmail(customerName, customerGreeting, variant = 0, seed = 0) {
    const refusalReason = generateRefusalReason(customerName);
    
    let body = `${customerGreeting}\n\n`;
    body += `Thanks for your email. I'm not comfortable providing bank statements - ${refusalReason.tone.includes('privacy') ? 'too much private information' : refusalReason.tone.includes('discrimination') ? 'seems like age discrimination' : 'already provided sufficient docs'}.\n\n`;
    body += `Can we discuss alternatives?\n\n`;
    body += `Thanks,\n${customerName}`;
    
    return body;
}

// 谨慎型KYC拒绝邮件
function generateCautiousKYCRefusalEmail(customerName, customerGreeting, variant = 0, seed = 0) {
    let body = `${customerGreeting}\n\n`;
    body += `Thank you for your email regarding the enhanced KYC documentation request.\n\n`;
    body += `I have concerns about providing bank statements due to privacy and data security considerations. Before I can proceed, I need to understand:\n\n`;
    body += `- How will the statements be stored and protected?\n`;
    body += `- Who will have access to this information?\n`;
    body += `- What are your data retention policies?\n`;
    body += `- What happens in case of a data breach?\n\n`;
    body += `I have already provided identification and proof of address. I believe we should explore alternative verification methods that can satisfy compliance requirements while protecting my privacy.\n\n`;
    body += `I look forward to discussing alternatives.\n\n`;
    body += `Best regards,\n${customerName}`;
    
    return body;
}

// 急切型KYC拒绝邮件
function generateUrgentKYCRefusalEmail(customerName, customerGreeting, variant = 0, seed = 0) {
    let body = `${customerGreeting}\n\n`;
    body += `I can't provide bank statements - ${generateRefusalReason(customerName).tone.includes('privacy') ? 'too invasive' : 'seems discriminatory'}.\n\n`;
    body += `I've already given you ID and address proof. What other options do we have?\n\n`;
    body += `Thanks,\n${customerName}`;
    
    return body;
}

// 友好型KYC拒绝邮件
function generateFriendlyKYCRefusalEmail(customerName, customerGreeting, variant = 0, seed = 0) {
    const refusalReason = generateRefusalReason(customerName);
    
    let body = `${customerGreeting}\n\n`;
    body += `Thanks for your email! I appreciate you reaching out.\n\n`;
    const reasonText = refusalReason.tone.includes('privacy') 
        ? 'They contain a lot of personal information that I\'d rather keep private.' 
        : refusalReason.tone.includes('discrimination') 
            ? 'It seems like this is based on my age, which doesn\'t feel right.' 
            : 'I feel like I\'ve already provided sufficient documentation.';
    body += `I understand you need additional documentation, but I'm not comfortable sharing bank statements. ${reasonText}\n\n`;
    body += `I've already submitted my ID and proof of address. Is there another way we can verify everything? Maybe a bank letter or something similar?\n\n`;
    body += `I'm happy to work with you to find a solution!\n\n`;
    body += `Best regards,\n${customerName}`;
    
    return body;
}

// 专业型KYC拒绝邮件
function generateProfessionalKYCRefusalEmail(customerName, customerGreeting, variant = 0, seed = 0, additionalInfo = '') {
    let body = `${customerGreeting}\n\n`;
    body += `Thank you for your email regarding the enhanced KYC documentation request.\n\n`;
    body += `I have reviewed your request for bank statements covering the last 2-3 months. While I understand the compliance requirements, I have concerns regarding this particular request.\n\n`;
    body += `I have already provided comprehensive identification and address verification documentation. The additional requirement for bank statements appears excessive, particularly as it seems to be based on age rather than transaction risk factors.\n\n`;
    body += `I would be open to discussing alternative verification methods that can satisfy your compliance requirements while respecting privacy concerns. Options might include bank confirmation letters, tax documentation, or other official financial records.\n\n`;
    if (additionalInfo) {
        body += `${additionalInfo}\n\n`;
    }
    body += `I look forward to your response and hope we can find a mutually acceptable solution.\n\n`;
    body += `Best regards,\n${customerName}`;
    
    return body;
}

// ========== KYC同意提供邮件生成函数 ==========

// 话多型KYC同意邮件
function generateVerboseKYCProvisionEmail(customerName, customerGreeting, variant = 0, seed = 0, additionalInfo = '') {
    const variants = [
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `Thank you for your email regarding the enhanced KYC documentation request. I appreciate you taking the time to explain the requirements clearly.\n\n`;
            body += `I understand that you need bank statements for the last 2-3 months as part of the enhanced KYC process. I'm happy to provide these documents to help move things forward.\n\n`;
            body += `I'll gather all the necessary statements from my accounts and prepare them for submission. Should I send them via email, or is there a secure portal where I can upload them? Also, do you need statements from all my accounts, or just the primary one I'll be using for transactions?\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `I want to make sure I provide everything correctly the first time, so please let me know if there are any specific formatting requirements or additional information you might need.\n\n`;
            body += `I'll aim to send these documents within the next few business days. If you need them sooner, please let me know and I'll do my best to accommodate.\n\n`;
            body += `Thank you for your patience, and I look forward to completing this process.\n\n`;
            body += `Best regards,\n${customerName}`;
            return body;
        },
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `I received your email about the enhanced KYC documentation, and I wanted to respond promptly.\n\n`;
            body += `I understand the need for bank statements covering the last 2-3 months. This makes sense from a compliance perspective, and I'm prepared to provide these documents.\n\n`;
            body += `I have accounts at a couple of different banks - should I include statements from all of them, or just the main account I'll be using? Also, are PDF statements directly from the bank acceptable, or do you need them in a specific format?\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `I'm planning to gather everything together and send it over within the next week. Is there a preferred method for submission - email attachment, secure upload, or something else?\n\n`;
            body += `Please let me know if there's anything else you need from my end to complete this verification process.\n\n`;
            body += `Best regards,\n${customerName}`;
            return body;
        },
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `Thank you for reaching out regarding the enhanced KYC documentation requirements.\n\n`;
            body += `I've reviewed your request for bank statements for the last 2-3 months, and I'm happy to provide these documents. I understand this is part of your compliance procedures, and I want to make sure we can move forward smoothly.\n\n`;
            body += `A few quick questions before I send everything over:\n\n`;
            body += `- Do you need statements from all accounts, or just the primary one?\n`;
            body += `- Are digital statements from my bank's online portal acceptable?\n`;
            body += `- Is there a file size limit or preferred format for the attachments?\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `I'll start gathering the documents right away and should be able to send them within the next few business days. If you have any specific requirements or deadlines, please let me know.\n\n`;
            body += `I appreciate your help in getting this sorted out.\n\n`;
            body += `Best regards,\n${customerName}`;
            return body;
        },
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `I got your email about the enhanced KYC documentation request, and I wanted to let you know that I'm on it.\n\n`;
            body += `I understand you need bank statements for the last 2-3 months. No problem - I'll pull those together and get them over to you.\n\n`;
            body += `Just to make sure I send everything correctly, could you clarify a couple of things? Do you need statements from all my accounts, or just the main one? And are PDFs from my bank's website okay, or do you need something more official?\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `I'm planning to send everything within the next week. Is email the best way to send these, or do you have a secure upload system?\n\n`;
            body += `Let me know if there's anything else you need, and I'll get it sorted.\n\n`;
            body += `Best regards,\n${customerName}`;
            return body;
        },
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `Thank you for your email regarding the enhanced KYC documentation requirements.\n\n`;
            body += `I understand that you need bank statements covering the last 2-3 months as part of the enhanced verification process. I'm prepared to provide these documents and want to ensure I submit everything correctly.\n\n`;
            body += `Before I gather and send the statements, I'd like to confirm a few details:\n\n`;
            body += `1. Should I include statements from all my bank accounts, or only the primary account I'll be using for transactions?\n`;
            body += `2. Are electronic statements downloaded from my bank's online portal acceptable, or do you require original paper statements?\n`;
            body += `3. What is the preferred method for submission - email attachment, secure portal upload, or another method?\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `I'll begin collecting the necessary documents immediately and aim to submit them within the next 3-5 business days. If you have any specific formatting requirements or deadlines, please let me know.\n\n`;
            body += `I appreciate your assistance in completing this process, and I'm happy to provide any additional information you might need.\n\n`;
            body += `Best regards,\n${customerName}`;
            return body;
        }
    ];
    
    return variants[variant % variants.length]();
}

// 话少型KYC同意邮件
function generateConciseKYCProvisionEmail(customerName, customerGreeting, variant = 0, seed = 0, additionalInfo = '') {
    const variants = [
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `Thanks for your email. I can provide the bank statements - I'll send them within the next few days.\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `Do you need statements from all accounts or just the main one?\n\n`;
            body += `Thanks,\n${customerName}`;
            return body;
        },
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `Got it. I'll prepare the bank statements and send them over this week.\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `Should I email them or upload somewhere?\n\n`;
            body += `Best,\n${customerName}`;
            return body;
        },
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `I can provide the statements. Will send them within a few business days.\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `Any specific format requirements?\n\n`;
            body += `Regards,\n${customerName}`;
            return body;
        }
    ];
    
    return variants[variant % variants.length]();
}

// 谨慎型KYC同意邮件
function generateCautiousKYCProvisionEmail(customerName, customerGreeting, variant = 0, seed = 0, additionalInfo = '') {
    const variants = [
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `Thank you for your email regarding the enhanced KYC documentation request.\n\n`;
            body += `I understand the requirement for bank statements covering the last 2-3 months. While I want to comply with your requirements, I'd like to confirm a few details before submitting these sensitive documents.\n\n`;
            body += `Could you please clarify:\n`;
            body += `- How will these documents be stored and protected?\n`;
            body += `- Who will have access to them?\n`;
            body += `- Are digital statements acceptable, or do you require originals?\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `Once I have these details, I'll proceed with gathering and submitting the statements within the next week.\n\n`;
            body += `I appreciate your understanding.\n\n`;
            body += `Best regards,\n${customerName}`;
            return body;
        },
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `I received your request for bank statements as part of the enhanced KYC process.\n\n`;
            body += `I'm willing to provide these documents, but I'd like to ensure they're handled securely. Could you confirm your data protection measures and how long these documents will be retained?\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `Once I have this information, I'll prepare and send the statements.\n\n`;
            body += `Thank you,\n${customerName}`;
            return body;
        }
    ];
    
    return variants[variant % variants.length]();
}

// 紧急型KYC同意邮件
function generateUrgentKYCProvisionEmail(customerName, customerGreeting, variant = 0, seed = 0, additionalInfo = '') {
    const variants = [
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `I'll get those bank statements to you ASAP - probably by tomorrow or the day after.\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `Email attachment works best for me. Should I send them all together or separately?\n\n`;
            body += `Thanks,\n${customerName}`;
            return body;
        },
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `I'm on it - will send the statements today or tomorrow.\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `Is email okay?\n\n`;
            body += `Best,\n${customerName}`;
            return body;
        }
    ];
    
    return variants[variant % variants.length]();
}

// 友好型KYC同意邮件
function generateFriendlyKYCProvisionEmail(customerName, customerGreeting, variant = 0, seed = 0, additionalInfo = '') {
    const variants = [
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `Thanks for your email! I'm happy to provide the bank statements you need.\n\n`;
            body += `I'll gather everything together and send them over within the next few days. Just let me know if you need statements from all my accounts or just the main one.\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `Email works great for me - is that okay with you?\n\n`;
            body += `Looking forward to getting this sorted!\n\n`;
            body += `Best regards,\n${customerName}`;
            return body;
        },
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `Hi! Got your message about the bank statements - no problem at all.\n\n`;
            body += `I'll pull those together and send them your way this week. Should I include all accounts or just the primary one?\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `Let me know if you need anything else!\n\n`;
            body += `Thanks,\n${customerName}`;
            return body;
        },
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `Thanks for reaching out! I'm happy to help with the KYC documentation.\n\n`;
            body += `I'll get those bank statements ready and send them over within the next few business days. Do you prefer email or is there a portal I should use?\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `If you need anything else, just let me know!\n\n`;
            body += `Best,\n${customerName}`;
            return body;
        }
    ];
    
    return variants[variant % variants.length]();
}

// 专业型KYC同意邮件
function generateProfessionalKYCProvisionEmail(customerName, customerGreeting, variant = 0, seed = 0, additionalInfo = '') {
    const variants = [
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `Thank you for your email regarding the enhanced KYC documentation requirements.\n\n`;
            body += `I acknowledge your request for bank statements covering the last 2-3 months. I am prepared to provide these documents to facilitate the verification process.\n\n`;
            body += `To ensure I submit the correct documentation, could you please confirm:\n`;
            body += `- Whether statements from all accounts are required, or only the primary transaction account\n`;
            body += `- The preferred submission method (email attachment, secure portal, etc.)\n`;
            body += `- Any specific formatting or file requirements\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `I will gather the necessary statements and submit them within 3-5 business days. Please let me know if you require expedited processing or have any specific deadlines.\n\n`;
            body += `I appreciate your assistance in completing this verification.\n\n`;
            body += `Best regards,\n${customerName}`;
            return body;
        },
        () => {
            let body = `${customerGreeting}\n\n`;
            body += `I have received your request for enhanced KYC documentation, specifically bank statements for the last 2-3 months.\n\n`;
            body += `I will prepare and submit these documents in accordance with your requirements. Please advise on your preferred submission method and any specific formatting guidelines.\n\n`;
            if (additionalInfo) {
                body += `${additionalInfo}\n\n`;
            }
            body += `I anticipate submitting the documentation within the next business week. Should you require any additional information or have specific deadlines, please let me know.\n\n`;
            body += `Thank you for your cooperation.\n\n`;
            body += `Best regards,\n${customerName}`;
            return body;
        }
    ];
    
    return variants[variant % variants.length]();
}

// 生成Titan.email界面HTML
function generateEmailHTML(conversation, customerName, senderEmail, purposeDetails, customerGreeting, emailDate) {
    const conversationScene = document.querySelector('input[name="conversationScene"]:checked').value;
    const willProvide = conversationScene === 'kyc' 
        ? document.querySelector('input[name="willProvide"]:checked')?.value === 'yes'
        : null;
    
    // 获取额外信息
    const additionalInfo = document.getElementById('additionalInfo')?.value || '';
    
    // 生成邮件格式的对话
    const emails = generateEmailConversation(customerName, purposeDetails, conversationScene, willProvide, customerGreeting, additionalInfo);
    
    // 保存邮件数据用于编辑
    currentEmails = emails;
    currentCustomerName = customerName;
    currentSenderEmail = senderEmail;
    currentRecipientEmail = null; // 不再需要收件人邮箱
    currentEmailDate = emailDate;
    currentPlatform = 'email';
    
    // 获取附件列表（安全获取，避免错误）
    let attachments = [];
    try {
        if (typeof window !== 'undefined' && window.getAttachments && typeof window.getAttachments === 'function') {
            attachments = window.getAttachments() || [];
        }
    } catch (e) {
        console.warn('获取附件列表时出错:', e);
        attachments = [];
    }
    currentAttachments = attachments;
    
    // 生成完整的Titan.email界面HTML
    const html = generateTitanEmailHTML(emails, customerName, senderEmail, conversationScene, emailDate, attachments);
    
    // 在预览区域显示邮件HTML
    const preview = document.getElementById('conversationPreview');
    if (preview) {
        // 创建iframe来显示邮件HTML
        preview.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        iframe.style.background = 'white';
        preview.appendChild(iframe);
        
        // 将HTML写入iframe
        iframe.contentDocument.open();
        iframe.contentDocument.write(html);
        iframe.contentDocument.close();
    }
    
    // 显示编辑按钮
    const editBtn = document.getElementById('editConversationBtn');
    if (editBtn) {
        editBtn.style.display = 'inline-block';
        editBtn.textContent = '编辑邮件';
    }
    
    // 显示下载按钮
    displayEmailHTMLDownload(html, customerName);
}

// 生成Titan.email界面HTML
function generateTitanEmailHTML(emails, customerName, senderEmail, conversationScene, emailDate, attachments = []) {
    // 根据场景生成主题
    const subject = conversationScene === 'kyc' 
        ? 'Enhanced KYC Documentation Request'
        : 'Account Opening Inquiry - USD to USDT';
    
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Titan Email - ${subject}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
            min-height: 100vh;
        }
        .email-wrapper {
            max-width: 900px;
            width: 100%;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .column-MessageList {
            min-width: 562px;
            max-width: 100%;
            background: #fafafa;
        }
        .message-list-header {
            padding: 20px 24px;
            border-bottom: 1px solid #e0e0e0;
            background: #ffffff;
        }
        .message-subject-wrap {
            margin-top: 0;
        }
        .message-subject {
            font-size: 22px;
            font-weight: 700;
            color: #1a1a1a;
            line-height: 1.3;
        }
        .messages-wrap {
            padding: 0;
            background: #ffffff;
        }
        .message-item-wrap {
            border-bottom: 1px solid #e0e0e0;
            background: #ffffff;
        }
        .message-item-white-wrap {
            background: #ffffff;
        }
        .message-header {
            padding: 20px 24px;
            border-bottom: none;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            position: relative;
            background: #ffffff;
        }
        .message-participants {
            flex: 1;
        }
        .participants {
            margin-bottom: 8px;
        }
        .participants.from-participants {
            margin-bottom: 4px;
        }
        .participants.to-participants {
            margin-bottom: 0;
        }
        .participant-name {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 14px;
        }
        .from-contact-email {
            color: #666;
            font-size: 14px;
            margin-left: 4px;
        }
        .participant-label {
            color: #666;
            font-size: 14px;
        }
        .to-contact {
            color: #1a1a1a;
            font-size: 14px;
        }
        .message-header-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .message-time {
            color: #999;
            font-size: 14px;
        }
        .message-actions {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .message-action-btn {
            width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            cursor: pointer;
            opacity: 0.6;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }
        .message-action-btn:hover {
            opacity: 1;
        }
        .message-action-btn svg {
            width: 20px;
            height: 20px;
        }
        .message-action-btn svg path {
            stroke: #666;
            stroke-width: 1.5;
            fill: none;
        }
        .message-action-btn svg circle {
            fill: #666;
        }
        .message-body-container {
            padding: 24px;
            background: #ffffff;
            border-left: 1px solid #e0e0e0;
            border-right: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
        }
        .message-body {
            line-height: 1.8;
            color: #1a1a1a;
            white-space: pre-wrap;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .message-body strong {
            font-weight: 600;
        }
        .attachments-section {
            margin-top: 20px;
            padding: 16px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
        }
        .attachments-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
        }
        .attachment-icon {
            width: 20px;
            height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .attachment-count {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 14px;
        }
        .attachment-download-all {
            color: #0066cc;
            font-size: 14px;
            cursor: pointer;
            text-decoration: none;
        }
        .attachment-download-all:hover {
            text-decoration: underline;
        }
        .attachments-list {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }
        .attachment-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 14px;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            min-width: 180px;
            width: 300px;
            max-width: 300px;
            cursor: pointer;
            transition: box-shadow 0.2s;
        }
        .attachment-item:hover {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .attachment-icon-large {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            flex-shrink: 0;
        }
        .attachment-icon-large.pdf {
            background: transparent;
        }
        .attachment-icon-large.image {
            background: transparent;
        }
        .attachment-icon-large.other {
            background: #6c757d;
        }
        .attachment-icon-large svg {
            width: 28px;
            height: 28px;
            fill: white;
        }
        .attachment-icon-large.image svg {
            opacity: 0.8;
        }
        .attachment-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .attachment-name {
            font-size: 14px;
            color: #1a1a1a;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.3;
        }
        .attachment-size {
            font-size: 12px;
            color: #666;
            line-height: 1.2;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="column-MessageList">
            <div class="message-list-header">
                <div class="message-subject-wrap">
                    <span class="message-subject">${subject}</span>
                </div>
            </div>
            <div class="messages-wrap">`;
    
    emails.forEach((email, index) => {
        const isCustomer = email.sender === 'customer';
        const fromName = isCustomer ? customerName : 'WSP Team';
        // 邮件是客户发给WSP Team的
        // 客户发送邮件时，客户是寄件人，应该显示客户邮箱（senderEmail）
        // 收件人只显示"me"，不显示邮箱地址
        const fromEmail = senderEmail; // 客户邮箱（寄件人邮箱）
        const toName = 'WSP Team'; // 收件人只显示"me"，不显示邮箱
        
        // 使用用户输入的日期
        const dateStr = emailDate || formatEmailDateForDisplay(email.date);
        
        html += `
            <div class="message-item-wrap">
                <div class="message-item-white-wrap">
                    <header class="message-header">
                        <div class="message-participants">
                            <div class="participants from-participants">
                                <span class="participant-name">${fromName}</span>
                                <span class="from-contact-email">&lt;${fromEmail}&gt;</span>
                            </div>
                            <div class="participants to-participants" style="border-bottom: none; padding-bottom: 0;">
                                <span class="participant-label">給:&nbsp;</span>
                                <span class="to-contact">me</span>
                            </div>
                        </div>
                        <div class="message-header-right">
                            <div class="message-time">${dateStr}</div>
                            <div class="message-actions">
                                <button class="message-action-btn" title="Expand">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <!-- 左下角L形 -->
                                        <path d="M3 21v-6h2v4h4v2H3z" stroke="#666" stroke-width="1.5" fill="none"/>
                                        <!-- 右上角L形 -->
                                        <path d="M21 3v6h-2V5h-4V3h6z" stroke="#666" stroke-width="1.5" fill="none"/>
                                    </svg>
                                </button>
                                <button class="message-action-btn" title="New Window">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <rect x="4" y="4" width="16" height="16" rx="1.5" stroke="#666" stroke-width="1.5" fill="none"/>
                                        <rect x="7" y="7" width="10" height="8" rx="0.5" stroke="#666" stroke-width="1.5" fill="none"/>
                                    </svg>
                                </button>
                                <button class="message-action-btn" title="Reply">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" stroke="#666" stroke-width="1.5" fill="none"/>
                                    </svg>
                                </button>
                                <button class="message-action-btn" title="More">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <circle cx="6" cy="12" r="1.5" fill="#666"/>
                                        <circle cx="12" cy="12" r="1.5" fill="#666"/>
                                        <circle cx="18" cy="12" r="1.5" fill="#666"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </header>
                    <div class="message-body-container">
                        <div class="message-body">${escapeHtml(email.body)}</div>
                        ${attachments.length > 0 && index === 0 ? generateAttachmentsHTML(attachments) : ''}
                    </div>
                </div>
            </div>`;
    });
    
    html += `
            </div>
        </div>
    </div>
</body>
</html>`;
    
    return html;
}

// 生成附件HTML
function generateAttachmentsHTML(attachments) {
    if (!attachments || attachments.length === 0) {
        return '';
    }
    
    let html = `
        <div class="attachments-section">
            <div class="attachments-header">
                <svg class="attachment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                <span class="attachment-count">${attachments.length} Attachment${attachments.length !== 1 ? 's' : ''}</span>
                <a href="#" class="attachment-download-all">Download</a>
            </div>
            <div class="attachments-list">`;
    
    attachments.forEach(attachment => {
        const fileType = attachment.type || 'other';
        const fileName = attachment.name || 'Untitled';
        const fileSize = attachment.size || '0 KB';
        
        // 提取文件名和扩展名
        let baseFileName = fileName;
        let fileExtension = '';
        if (fileName.includes('.')) {
            const lastDotIndex = fileName.lastIndexOf('.');
            baseFileName = fileName.substring(0, lastDotIndex);
            // 保持原始大小写，不强制转换为大写
            fileExtension = fileName.substring(lastDotIndex + 1);
        }
        
        // 根据文件类型选择图标
        let iconSVG = '';
        if (fileType === 'pdf') {
            // 使用pdf.svg文件
            iconSVG = `<img src="./pdf.svg" alt="PDF" style="width: 100%; height: 100%; object-fit: contain;">`;
        } else if (fileType === 'image') {
            // 使用jpg.svg文件 - 内联SVG内容以确保在iframe中正确显示
            iconSVG = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" height="100%" viewBox="0 0 116 128" enable-background="new 0 0 116 128" xml:space="preserve" style="width: 100%; height: 100%; object-fit: contain;"><path fill="#FFFFFF" opacity="1.000000" stroke="none" d="M117.000000,54.000000 C117.000000,79.333328 117.000000,104.166656 117.000000,129.000000 C78.333344,129.000000 39.666683,129.000000 1.000017,129.000000 C1.000011,86.333344 1.000011,43.666691 1.000006,1.000029 C39.666649,1.000019 78.333298,1.000019 116.999969,1.000010 C117.000000,18.500000 117.000000,36.000000 117.000000,54.000000 M104.731155,30.422153 C96.164169,21.762621 87.597176,13.103086 78.284821,4.089439 C59.957417,4.060277 41.629887,3.980042 23.302664,4.024880 C14.941196,4.045336 10.091693,8.902159 10.038157,17.477024 C9.939349,33.303761 10.055558,49.131844 10.011118,65.906464 C10.007572,81.066483 9.937956,96.226906 10.028339,111.386360 C10.073568,118.972321 14.561431,123.896187 21.874126,123.939049 C46.029316,124.080605 70.186470,124.079231 94.341545,123.925606 C101.190498,123.882050 105.727669,119.082726 105.948845,112.168655 C106.097649,107.516907 105.839394,102.852135 105.933533,97.245369 C105.955269,76.376465 105.992348,55.507542 105.959541,34.638725 C105.957634,33.424458 105.389603,32.211079 104.731155,30.422153 z"/><path fill="#7FAFF0" opacity="1.000000" stroke="none" d="M10.082183,64.959366 C10.055558,49.131844 9.939349,33.303761 10.038157,17.477024 C10.091693,8.902159 14.941196,4.045336 23.302664,4.024880 C41.629887,3.980042 59.957417,4.060277 78.627968,4.777457 C78.965317,10.442327 78.923981,15.419463 78.963615,20.395954 C79.003952,25.461153 81.705643,29.740534 86.172401,30.578863 C92.287392,31.726530 98.763634,30.949423 105.085037,30.997288 C105.389603,32.211079 105.957634,33.424458 105.959541,34.638725 C105.992348,55.507542 105.955269,76.376465 105.560028,97.551895 C99.753708,92.980080 94.221840,88.205894 88.933167,83.176003 C86.566483,80.925110 84.710594,80.825073 82.012131,82.646690 C75.961227,86.731400 69.613472,90.375290 63.544041,94.434120 C60.994873,96.138832 59.155994,96.335701 56.429562,94.493813 C43.113491,85.497856 29.630259,76.748314 16.156631,67.987778 C14.272141,66.762489 12.113772,65.958420 10.082183,64.959366 M67.229736,59.632336 C71.076950,53.551960 70.895500,48.146484 66.695953,43.730759 C62.863720,39.701256 56.843079,38.809486 52.083344,41.566357 C45.900627,45.147442 44.100288,53.012917 48.137070,58.807251 C52.549938,65.141434 59.920048,65.699677 67.229736,59.632336 z"/><path fill="#3E5F8D" opacity="1.000000" stroke="none" d="M10.046650,65.432915 C12.113772,65.958420 14.272141,66.762489 16.156631,67.987778 C29.630259,76.748314 43.113491,85.497856 56.429562,94.493813 C59.155994,96.335701 60.994873,96.138832 63.544041,94.434120 C69.613472,90.375290 75.961227,86.731400 82.012131,82.646690 C84.710594,80.825073 86.566483,80.925110 88.933167,83.176003 C94.221840,88.205894 99.753708,92.980080 105.474884,98.025803 C105.839394,102.852135 106.097649,107.516907 105.948845,112.168655 C105.727669,119.082726 101.190498,123.882050 94.341545,123.925606 C70.186470,124.079231 46.029316,124.080605 21.874126,123.939049 C14.561431,123.896187 10.073568,118.972321 10.028339,111.386360 C9.937956,96.226906 10.007572,81.066483 10.046650,65.432915 z"/><path fill="#5278AE" opacity="1.000000" stroke="none" d="M104.908096,30.709721 C98.763634,30.949423 92.287392,31.726530 86.172401,30.578863 C81.705643,29.740534 79.003952,25.461153 78.963615,20.395954 C78.923981,15.419463 78.965317,10.442327 79.000648,4.954515 C87.597176,13.103086 96.164169,21.762621 104.908096,30.709721 z"/><path fill="#F6D056" opacity="1.000000" stroke="none" d="M66.991417,59.924828 C59.920048,65.699677 52.549938,65.141434 48.137070,58.807251 C44.100288,53.012917 45.900627,45.147442 52.083344,41.566357 C56.843079,38.809486 62.863720,39.701256 66.695953,43.730759 C70.895500,48.146484 71.076950,53.551960 66.991417,59.924828 z"/></svg>`;
        } else {
            iconSVG = `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>`;
        }
        
        html += `
            <div class="attachment-item">
                <div class="attachment-icon-large ${fileType}">
                    ${fileType === 'pdf' ? iconSVG : iconSVG}
                </div>
                <div class="attachment-info">
                    <div class="attachment-name">${escapeHtml(baseFileName)}${fileExtension ? '.' + escapeHtml(fileExtension) : ''}</div>
                    <div class="attachment-size">${escapeHtml(fileSize)}</div>
                </div>
            </div>`;
    });
    
    html += `
            </div>
        </div>`;
    
    return html;
}

// 显示可编辑的对话界面
function showEditableConversation(conversation) {
    const editArea = document.getElementById('conversationEditArea');
    const editableMessages = document.getElementById('editableMessages');
    if (!editArea || !editableMessages) {
        console.error('编辑区域未找到');
        return;
    }
    
    editableMessages.innerHTML = '';
    
    conversation.forEach((msg, index) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'editable-message';
        msgDiv.style.marginBottom = '15px';
        msgDiv.style.padding = '10px';
        msgDiv.style.border = '1px solid #ddd';
        msgDiv.style.borderRadius = '5px';
        msgDiv.style.backgroundColor = '#f9f9f9';
        
        const headerDiv = document.createElement('div');
        headerDiv.style.marginBottom = '8px';
        headerDiv.style.display = 'flex';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.gap = '10px';
        headerDiv.style.flexWrap = 'wrap';
        
        const senderLabel = document.createElement('label');
        senderLabel.textContent = `发送者 (${index + 1}): `;
        senderLabel.style.fontWeight = 'bold';
        senderLabel.style.marginRight = '5px';
        
        const senderSelect = document.createElement('select');
        senderSelect.className = 'editable-msg-sender';
        senderSelect.setAttribute('data-index', index);
        senderSelect.style.padding = '5px';
        senderSelect.style.borderRadius = '3px';
        senderSelect.style.border = '1px solid #ccc';
        senderSelect.style.minWidth = '80px';
        
        const option1 = document.createElement('option');
        option1.value = 'customer';
        option1.textContent = '客户';
        if (msg.sender === 'customer') option1.selected = true;
        
        const option2 = document.createElement('option');
        option2.value = 'company';
        option2.textContent = '公司';
        if (msg.sender === 'company') option2.selected = true;
        
        senderSelect.appendChild(option1);
        senderSelect.appendChild(option2);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️ 删除';
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-message-btn';
        deleteBtn.setAttribute('data-index', index);
        deleteBtn.style.padding = '6px 12px';
        deleteBtn.style.backgroundColor = '#ff4444';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '3px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '13px';
        deleteBtn.style.fontWeight = 'bold';
        deleteBtn.style.marginLeft = 'auto';
        deleteBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('确定要删除这条消息吗？')) {
                conversation.splice(index, 1);
                showEditableConversation(conversation);
            }
            return false;
        };
        
        headerDiv.appendChild(senderLabel);
        headerDiv.appendChild(senderSelect);
        headerDiv.appendChild(deleteBtn);
        
        const textarea = document.createElement('textarea');
        textarea.className = 'editable-msg-text';
        textarea.setAttribute('data-index', index);
        textarea.value = msg.text;
        textarea.style.width = '100%';
        textarea.style.minHeight = '60px';
        textarea.style.padding = '8px';
        textarea.style.border = '1px solid #ccc';
        textarea.style.borderRadius = '3px';
        textarea.style.fontSize = '14px';
        textarea.style.fontFamily = 'inherit';
        textarea.style.resize = 'vertical';
        textarea.style.marginBottom = '5px';
        
        const timeDiv = document.createElement('div');
        timeDiv.style.display = 'flex';
        timeDiv.style.alignItems = 'center';
        timeDiv.style.gap = '5px';
        
        const timeLabel = document.createElement('label');
        timeLabel.textContent = '时间: ';
        timeLabel.style.fontSize = '12px';
        timeLabel.style.color = '#666';
        
        const timeInput = document.createElement('input');
        timeInput.type = 'text';
        timeInput.className = 'editable-msg-time';
        timeInput.setAttribute('data-index', index);
        timeInput.value = msg.time;
        timeInput.style.padding = '3px 5px';
        timeInput.style.border = '1px solid #ccc';
        timeInput.style.borderRadius = '3px';
        timeInput.style.fontSize = '12px';
        timeInput.style.width = '150px';
        
        timeDiv.appendChild(timeLabel);
        timeDiv.appendChild(timeInput);
        
        msgDiv.appendChild(headerDiv);
        msgDiv.appendChild(textarea);
        msgDiv.appendChild(timeDiv);
        
        editableMessages.appendChild(msgDiv);
    });
    
    // 更新全局变量
    currentConversation = conversation;
}

// 显示可编辑的邮件界面
function showEditableEmail(emails) {
    const editArea = document.getElementById('conversationEditArea');
    const editableMessages = document.getElementById('editableMessages');
    if (!editArea || !editableMessages) {
        console.error('编辑区域未找到');
        return;
    }
    
    editableMessages.innerHTML = '';
    
    emails.forEach((email, index) => {
        const emailDiv = document.createElement('div');
        emailDiv.className = 'editable-email';
        emailDiv.style.marginBottom = '20px';
        emailDiv.style.padding = '15px';
        emailDiv.style.border = '1px solid #ddd';
        emailDiv.style.borderRadius = '5px';
        emailDiv.style.backgroundColor = '#f9f9f9';
        
        const headerDiv = document.createElement('div');
        headerDiv.style.marginBottom = '10px';
        headerDiv.style.display = 'flex';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.gap = '10px';
        headerDiv.style.flexWrap = 'wrap';
        
        const senderLabel = document.createElement('label');
        senderLabel.textContent = `发送者 (${index + 1}): `;
        senderLabel.style.fontWeight = 'bold';
        senderLabel.style.marginRight = '5px';
        
        const senderSelect = document.createElement('select');
        senderSelect.className = 'editable-email-sender';
        senderSelect.setAttribute('data-index', index);
        senderSelect.style.padding = '5px';
        senderSelect.style.borderRadius = '3px';
        senderSelect.style.border = '1px solid #ccc';
        senderSelect.style.minWidth = '100px';
        
        const option1 = document.createElement('option');
        option1.value = 'customer';
        option1.textContent = '客户';
        if (email.sender === 'customer') option1.selected = true;
        
        const option2 = document.createElement('option');
        option2.value = 'company';
        option2.textContent = '公司';
        if (email.sender === 'company') option2.selected = true;
        
        senderSelect.appendChild(option1);
        senderSelect.appendChild(option2);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️ 删除';
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-email-btn';
        deleteBtn.setAttribute('data-index', index);
        deleteBtn.style.padding = '6px 12px';
        deleteBtn.style.backgroundColor = '#ff4444';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '3px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '13px';
        deleteBtn.style.fontWeight = 'bold';
        deleteBtn.style.marginLeft = 'auto';
        deleteBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('确定要删除这封邮件吗？')) {
                emails.splice(index, 1);
                showEditableEmail(emails);
            }
            return false;
        };
        
        headerDiv.appendChild(senderLabel);
        headerDiv.appendChild(senderSelect);
        headerDiv.appendChild(deleteBtn);
        
        // 主题输入
        const subjectDiv = document.createElement('div');
        subjectDiv.style.marginBottom = '10px';
        
        const subjectLabel = document.createElement('label');
        subjectLabel.textContent = '邮件主题: ';
        subjectLabel.style.fontWeight = 'bold';
        subjectLabel.style.display = 'block';
        subjectLabel.style.marginBottom = '5px';
        
        const subjectInput = document.createElement('input');
        subjectInput.type = 'text';
        subjectInput.className = 'editable-email-subject';
        subjectInput.setAttribute('data-index', index);
        subjectInput.value = email.subject || '';
        subjectInput.style.width = '100%';
        subjectInput.style.padding = '8px';
        subjectInput.style.border = '1px solid #ccc';
        subjectInput.style.borderRadius = '3px';
        subjectInput.style.fontSize = '14px';
        
        subjectDiv.appendChild(subjectLabel);
        subjectDiv.appendChild(subjectInput);
        
        // 正文输入
        const bodyDiv = document.createElement('div');
        
        const bodyLabel = document.createElement('label');
        bodyLabel.textContent = '邮件正文: ';
        bodyLabel.style.fontWeight = 'bold';
        bodyLabel.style.display = 'block';
        bodyLabel.style.marginBottom = '5px';
        
        const bodyTextarea = document.createElement('textarea');
        bodyTextarea.className = 'editable-email-body';
        bodyTextarea.setAttribute('data-index', index);
        bodyTextarea.value = email.body || '';
        bodyTextarea.style.width = '100%';
        bodyTextarea.style.minHeight = '150px';
        bodyTextarea.style.padding = '8px';
        bodyTextarea.style.border = '1px solid #ccc';
        bodyTextarea.style.borderRadius = '3px';
        bodyTextarea.style.fontSize = '14px';
        bodyTextarea.style.fontFamily = 'inherit';
        bodyTextarea.style.resize = 'vertical';
        
        bodyDiv.appendChild(bodyLabel);
        bodyDiv.appendChild(bodyTextarea);
        
        emailDiv.appendChild(headerDiv);
        emailDiv.appendChild(subjectDiv);
        emailDiv.appendChild(bodyDiv);
        
        editableMessages.appendChild(emailDiv);
    });
    
    // 更新全局变量
    currentEmails = emails;
}

// 添加新消息
function addNewMessage() {
    if (currentPlatform === 'email' && currentEmails) {
        // 添加新邮件
        const newEmail = {
            sender: 'customer',
            subject: '',
            body: '',
            date: new Date()
        };
        
        currentEmails.push(newEmail);
        showEditableEmail(currentEmails);
        
        // 滚动到底部并聚焦到新邮件的正文文本框
        setTimeout(() => {
            const editArea = document.getElementById('conversationEditArea');
            if (editArea) {
                editArea.scrollTop = editArea.scrollHeight;
            }
            const lastTextarea = document.querySelector('.editable-email-body:last-child');
            if (lastTextarea) {
                lastTextarea.focus();
            }
        }, 100);
    } else if (currentConversation) {
        // 添加新消息
        const newMsg = {
            sender: 'customer',
            text: '',
            time: formatTime(new Date(), new Date().getHours(), new Date().getMinutes())
        };
        
        currentConversation.push(newMsg);
        showEditableConversation(currentConversation);
        
        // 滚动到底部并聚焦到新消息的文本框
        setTimeout(() => {
            const editArea = document.getElementById('conversationEditArea');
            if (editArea) {
                editArea.scrollTop = editArea.scrollHeight;
            }
            const lastTextarea = document.querySelector('.editable-msg-text:last-child');
            if (lastTextarea) {
                lastTextarea.focus();
            }
        }, 100);
    } else {
        alert('请先生成对话或邮件');
    }
}

// 保存编辑后的对话并更新HTML
function saveEditedConversation() {
    if (currentPlatform === 'email' && currentEmails) {
        // 邮件编辑保存
        const subjectInputs = document.querySelectorAll('.editable-email-subject');
        const bodyTextareas = document.querySelectorAll('.editable-email-body');
        const senderSelects = document.querySelectorAll('.editable-email-sender');
        
        // 更新邮件内容
        subjectInputs.forEach(input => {
            const index = parseInt(input.getAttribute('data-index'));
            if (currentEmails[index]) {
                currentEmails[index].subject = input.value;
            }
        });
        
        bodyTextareas.forEach(textarea => {
            const index = parseInt(textarea.getAttribute('data-index'));
            if (currentEmails[index]) {
                currentEmails[index].body = textarea.value;
            }
        });
        
        senderSelects.forEach(select => {
            const index = parseInt(select.getAttribute('data-index'));
            if (currentEmails[index]) {
                currentEmails[index].sender = select.value;
            }
        });
        
        // 重新生成邮件HTML
        const conversationScene = document.querySelector('input[name="conversationScene"]:checked').value;
        const html = generateTitanEmailHTML(currentEmails, currentCustomerName, currentSenderEmail, conversationScene, currentEmailDate, currentAttachments);
        
        // 在预览区域显示邮件HTML
        const preview = document.getElementById('conversationPreview');
        if (preview) {
            preview.innerHTML = '';
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '600px';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '8px';
            iframe.style.background = 'white';
            preview.appendChild(iframe);
            
            // 将HTML写入iframe
            iframe.contentDocument.open();
            iframe.contentDocument.write(html);
            iframe.contentDocument.close();
        }
        
        displayEmailHTMLDownload(html, currentCustomerName);
        
        // 隐藏编辑区域
        document.getElementById('conversationEditArea').style.display = 'none';
        document.getElementById('editConversationBtn').style.display = 'inline-block';
        document.getElementById('saveConversationBtn').style.display = 'none';
        document.getElementById('cancelEditBtn').style.display = 'none';
        document.getElementById('addMessageBtn').style.display = 'none';
    } else if (currentConversation) {
        // 对话编辑保存
        const textareas = document.querySelectorAll('.editable-msg-text');
        const senderSelects = document.querySelectorAll('.editable-msg-sender');
        const timeInputs = document.querySelectorAll('.editable-msg-time');
        
        // 更新对话内容
        textareas.forEach(textarea => {
            const index = parseInt(textarea.getAttribute('data-index'));
            if (currentConversation[index]) {
                currentConversation[index].text = textarea.value;
            }
        });
        
        senderSelects.forEach(select => {
            const index = parseInt(select.getAttribute('data-index'));
            if (currentConversation[index]) {
                currentConversation[index].sender = select.value;
            }
        });
        
        timeInputs.forEach(input => {
            const index = parseInt(input.getAttribute('data-index'));
            if (currentConversation[index]) {
                currentConversation[index].time = input.value;
            }
        });
        
        generateBrowserScript(currentConversation, currentPlatform);
        // 更新预览
        displayConversation(currentConversation);
        
        // 隐藏编辑区域
        document.getElementById('conversationEditArea').style.display = 'none';
        document.getElementById('editConversationBtn').style.display = 'inline-block';
        document.getElementById('saveConversationBtn').style.display = 'none';
        document.getElementById('cancelEditBtn').style.display = 'none';
        document.getElementById('addMessageBtn').style.display = 'none';
    } else {
        alert('没有可保存的内容');
    }
}

// 取消编辑
function cancelEdit() {
    if (currentPlatform === 'email' && currentEmails) {
        // 重新生成邮件预览
        const conversationScene = document.querySelector('input[name="conversationScene"]:checked').value;
        const html = generateTitanEmailHTML(currentEmails, currentCustomerName, currentSenderEmail, conversationScene, currentEmailDate, currentAttachments);
        
        const preview = document.getElementById('conversationPreview');
        if (preview) {
            preview.innerHTML = '';
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '600px';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '8px';
            iframe.style.background = 'white';
            preview.appendChild(iframe);
            
            iframe.contentDocument.open();
            iframe.contentDocument.write(html);
            iframe.contentDocument.close();
        }
    } else if (currentConversation) {
        displayConversation(currentConversation);
    }
    
    // 隐藏编辑区域
    document.getElementById('conversationEditArea').style.display = 'none';
    document.getElementById('editConversationBtn').style.display = 'inline-block';
    document.getElementById('saveConversationBtn').style.display = 'none';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('addMessageBtn').style.display = 'none';
}

// 格式化邮件日期显示
function formatEmailDateForDisplay(date) {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
}

// 显示邮件HTML下载
function displayEmailHTMLDownload(html, customerName) {
    const scriptCodeDiv = document.getElementById('scriptCode');
    scriptCodeDiv.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.marginTop = '20px';
    
    const title = document.createElement('h3');
    title.textContent = '邮件HTML文件：';
    title.style.marginBottom = '15px';
    title.style.color = '#333';
    container.appendChild(title);
    
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '生成并下载HTML文件';
    downloadBtn.className = 'btn copy-btn';
    downloadBtn.style.marginBottom = '20px';
    downloadBtn.onclick = () => downloadEmailHTML(html, customerName);
    container.appendChild(downloadBtn);
    
    const previewBtn = document.createElement('button');
    previewBtn.textContent = '在新窗口预览';
    previewBtn.className = 'btn copy-btn';
    previewBtn.style.marginLeft = '10px';
    previewBtn.style.background = '#17a2b8';
    previewBtn.onclick = () => {
        const newWindow = window.open();
        newWindow.document.write(html);
        newWindow.document.close();
    };
    container.appendChild(previewBtn);
    
    scriptCodeDiv.appendChild(container);
}

// 下载邮件HTML文件
function downloadEmailHTML(html, customerName) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_${customerName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 生成邮件文件（.eml格式）- 保留用于兼容
function generateEmailFiles(conversation, customerName, senderEmail, recipientEmail) {
    const emailFiles = [];
    const conversationScene = document.querySelector('input[name="conversationScene"]:checked').value;
    
    conversation.forEach((msg, index) => {
        const isCustomer = msg.sender === 'customer';
        const fromEmail = isCustomer ? recipientEmail : senderEmail;
        const toEmail = isCustomer ? senderEmail : recipientEmail;
        const fromName = isCustomer ? customerName : 'Will Zhang';
        const toName = isCustomer ? 'Will Zhang' : customerName;
        
        // 根据场景生成主题
        let subject;
        if (conversationScene === 'kyc') {
            subject = isCustomer 
                ? `Re: Enhanced KYC Documentation Request`
                : `Enhanced KYC Documentation Request`;
        } else {
            subject = isCustomer
                ? `Re: Account Opening Inquiry - USD to USDT`
                : `Account Opening Inquiry - USD to USDT`;
        }
        
        // 解析时间
        const timeParts = parseTime(msg.time);
        const emailDate = formatEmailDate(msg.time);
        
        // 生成Message-ID
        const messageId = generateMessageId(fromEmail, index);
        const inReplyTo = index > 0 ? generateMessageId(
            conversation[index - 1].sender === 'customer' ? recipientEmail : senderEmail,
            index - 1
        ) : '';
        
        // 生成邮件内容
        const emailContent = generateEMLContent(
            fromEmail,
            fromName,
            toEmail,
            toName,
            subject,
            emailDate,
            messageId,
            inReplyTo,
            msg.text,
            index
        );
        
        emailFiles.push({
            filename: `email_${index + 1}_${isCustomer ? 'customer' : 'company'}.eml`,
            content: emailContent
        });
    });
    
    // 显示下载按钮
    displayEmailDownloadButtons(emailFiles);
}

// 生成EML文件内容
function generateEMLContent(fromEmail, fromName, toEmail, toName, subject, date, messageId, inReplyTo, bodyText, index) {
    // RFC 822格式的邮件
    const lines = [];
    
    // 邮件头
    lines.push(`From: ${fromName} <${fromEmail}>`);
    lines.push(`To: ${toName} <${toEmail}>`);
    lines.push(`Subject: ${subject}`);
    lines.push(`Date: ${date}`);
    lines.push(`Message-ID: <${messageId}>`);
    if (inReplyTo) {
        lines.push(`In-Reply-To: <${inReplyTo}>`);
        lines.push(`References: <${inReplyTo}>`);
    }
    lines.push(`MIME-Version: 1.0`);
    lines.push(`Content-Type: text/plain; charset=UTF-8`);
    lines.push(`Content-Transfer-Encoding: 8bit`);
    lines.push(``); // 空行分隔头部和正文
    
    // 邮件正文
    lines.push(bodyText);
    
    return lines.join('\r\n');
}

// 格式化邮件日期（RFC 2822格式）
function formatEmailDate(timeStr) {
    // timeStr格式: "10/15 10:30"
    const parts = timeStr.split(' ');
    const datePart = parts[0]; // "10/15"
    const timePart = parts[1]; // "10:30"
    
    const [month, day] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    
    // 假设年份是2025
    const year = 2025;
    const date = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    
    // RFC 2822格式: "Mon, 15 Oct 2025 10:30:00 +0000"
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const formattedDate = `${dayName}, ${day} ${monthName} ${year} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00 +0000`;
    
    return formattedDate;
}

// 生成Message-ID
function generateMessageId(email, index) {
    const timestamp = Date.now() + index * 1000;
    const domain = email.split('@')[1];
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}.${random}@${domain}`;
}

// 显示邮件下载按钮
function displayEmailDownloadButtons(emailFiles) {
    const scriptCodeDiv = document.getElementById('scriptCode');
    scriptCodeDiv.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.marginTop = '20px';
    
    const title = document.createElement('h3');
    title.textContent = '邮件文件下载：';
    title.style.marginBottom = '15px';
    title.style.color = '#333';
    container.appendChild(title);
    
    const downloadAllBtn = document.createElement('button');
    downloadAllBtn.textContent = '下载所有邮件（ZIP）';
    downloadAllBtn.className = 'btn copy-btn';
    downloadAllBtn.style.marginBottom = '20px';
    downloadAllBtn.onclick = () => downloadAllEmailsAsZip(emailFiles);
    container.appendChild(downloadAllBtn);
    
    const list = document.createElement('div');
    emailFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.style.marginBottom = '10px';
        item.style.padding = '10px';
        item.style.backgroundColor = '#f8f9fa';
        item.style.borderRadius = '5px';
        
        const btn = document.createElement('button');
        btn.textContent = `下载: ${file.filename}`;
        btn.className = 'btn copy-btn';
        btn.style.fontSize = '12px';
        btn.style.padding = '6px 12px';
        btn.onclick = () => downloadEmailFile(file.filename, file.content);
        
        item.appendChild(btn);
        list.appendChild(item);
    });
    
    container.appendChild(list);
    scriptCodeDiv.appendChild(container);
}

// 下载单个邮件文件
function downloadEmailFile(filename, content) {
    const blob = new Blob([content], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 下载所有邮件为ZIP文件
function downloadAllEmailsAsZip(emailFiles) {
    // 使用JSZip库（已通过CDN引入）
    if (typeof JSZip !== 'undefined') {
        const zip = new JSZip();
        emailFiles.forEach(file => {
            zip.file(file.filename, file.content);
        });
        
        zip.generateAsync({ type: 'blob' }).then(content => {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'email_conversation.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }).catch(err => {
            console.error('ZIP生成失败:', err);
            // 降级到逐个下载
            downloadEmailsIndividually(emailFiles);
        });
    } else {
        // 如果没有JSZip，逐个下载
        downloadEmailsIndividually(emailFiles);
    }
}

// 逐个下载邮件文件
function downloadEmailsIndividually(emailFiles) {
    emailFiles.forEach((file, index) => {
        setTimeout(() => {
            downloadEmailFile(file.filename, file.content);
        }, index * 300);
    });
    alert('正在逐个下载邮件文件，请允许浏览器下载多个文件...');
}

// 生成WhatsApp消息HTML
function generateWhatsAppMessageHTML(msg, customerName, index) {
    const isCustomer = msg.sender === 'customer';
    const messageId = isCustomer ? `false_${Date.now()}@c.us_${generateRandomId()}` : `true_${Date.now()}@c.us_${generateRandomId()}`;
    const className = isCustomer ? '_amjv xa0aww2' : '_amjv xscbp6u';
    const messageClass = isCustomer ? 'message-in' : 'message-out';
    const tailIcon = isCustomer ? 'tail-in' : 'tail-out';
    const tailPath = isCustomer 
        ? '<path opacity="0.13" fill="#0000000" d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"></path><path fill="currentColor" d="M1.533,2.568L8,11.193V0L2.812,0C1.042,0,0.474,1.156,1.533,2.568z"></path>'
        : '<path opacity="0.13" d="M5.188,1H0v11.193l6.467-8.625 C7.526,2.156,6.958,1,5.188,1z"></path><path fill="currentColor" d="M5.188,0H0v11.193l6.467-8.625C7.526,1.156,6.958,0,5.188,0z"></path>';
    const ariaLabel = isCustomer ? `${customerName}: ` : 'You: ';
    const senderName = isCustomer ? customerName : 'Will Zhang';
    const bottomClass = isCustomer ? 'xrr41r3 xqcrz7y' : 'x1f889gz xpvyfi4';
    const bottomDivClass = isCustomer ? 'x1nhvcw1' : 'x13a6bvl';
    
    // 转换时间格式：从 "10/15 10:30" 转换为 "上午10:30" 和 "[上午10:30, 10/15/2025]"
    const timeParts = parseTime(msg.time);
    const timeDisplay = timeParts.display; // 如 "上午10:30"
    const timeFull = timeParts.full; // 如 "[上午10:30, 10/15/2025]"
    
    // 转义HTML
    const escapedText = escapeHtml(msg.text);
    
    let html = `<div class="x1n2onr6"><div tabindex="-1" class="" role="row"><div tabindex="-1" class="${className}" data-id="${messageId}"><div class="x78zum5 xdt5ytf" data-virtualized="false"><div class=""><div class="${messageClass} focusable-list-item _amjy _amjz _amjw x1klvx2g xahtqtb"><span class=""></span><div class="_amk4 false _amkd _amk5 false"><span aria-hidden="true" data-icon="${tailIcon}" class="_amk7"><svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="xMidYMid meet" class="" version="1.1" x="0px" y="0px" enable-background="new 0 0 8 13"><title>${tailIcon}</title>${tailPath}</svg></span><div class="_amk6 _amlo false false"><span aria-label="${ariaLabel}"></span><div><div class="x9f619 x1hx0egp x1yrsyyn xizg8k xu9hqtb xwib8y2"><div class="copyable-text" data-pre-plain-text="${timeFull} ${senderName}: "><div class="_akbu x6ikm8r x10wlt62"><span dir="ltr" class="x1f6kntn xjb2p0i x8r4c90 xo1l8bm x1ic7a3i x12xpedu _ao3e selectable-text copyable-text" style="min-height: 0px;"><span class="">${escapedText}</span></span><span class=""><span class="x3nfvp2 xxymvpz xlshs6z xqtp20y xexx8yu x1uc92m x18d9i69 x181vq82 x12lo8hy x152skdk" aria-hidden="true">${isCustomer ? '<span class="x1c4vz4f x2lah0s"></span>' : '<span class="x1c4vz4f x2lah0s xn6xy2s"></span>'}<span class="x1c4vz4f x2lah0s">${timeDisplay}</span></span></span></div></div><div class="x1n2onr6 x1n327nk x18mqm2i xhsvlbd x14z9mp xz62fqu x1wbi8v6"><div class="x1bvqhpb xx3o462 xuxw1ft x78zum5 x6s0dn4 x12lo8hy x152skdk"><span class="x1rg5ohu x16dsc37" dir="auto"><span class="x193iq5w xeuugli x13faqbe x1vvkbs xt0psk2 x1fj9vlw xhslqc4 x1hx0egp x1pg5gke xjb2p0i xo1l8bm xl2ypbo x1ic7a3i" style="--x-fontSize: 12px; --x-lineHeight: 8.5137px;">${timeDisplay}</span></span>${isCustomer ? '' : '<div class="xhslqc4 x1rg5ohu x7phf20"><span aria-hidden="false" aria-label=" Read " data-icon="msg-dblcheck" class="x1rv0e52"><svg viewBox="0 0 16 11" height="11" width="16" preserveAspectRatio="xMidYMid meet" class="" fill="none"><title>msg-dblcheck</title><path d="M11.0714 0.652832C10.991 0.585124 10.8894 0.55127 10.7667 0.55127C10.6186 0.55127 10.4916 0.610514 10.3858 0.729004L4.19688 8.36523L1.79112 6.09277C1.7488 6.04622 1.69802 6.01025 1.63877 5.98486C1.57953 5.95947 1.51817 5.94678 1.45469 5.94678C1.32351 5.94678 1.20925 5.99544 1.11192 6.09277L0.800883 6.40381C0.707784 6.49268 0.661235 6.60482 0.661235 6.74023C0.661235 6.87565 0.707784 6.98991 0.800883 7.08301L3.79698 10.0791C3.94509 10.2145 4.11224 10.2822 4.29844 10.2822C4.40424 10.2822 4.5058 10.259 4.60313 10.2124C4.70046 10.1659 4.78086 10.1003 4.84434 10.0156L11.4903 1.59863C11.5623 1.5013 11.5982 1.40186 11.5982 1.30029C11.5982 1.14372 11.5348 1.01888 11.4078 0.925781L11.0714 0.652832ZM8.6212 8.32715C8.43077 8.20866 8.2488 8.09017 8.0753 7.97168C7.99489 7.89128 7.8891 7.85107 7.75791 7.85107C7.6098 7.85107 7.4892 7.90397 7.3961 8.00977L7.10411 8.33984C7.01947 8.43717 6.97715 8.54508 6.97715 8.66357C6.97715 8.79476 7.0237 8.90902 7.1168 9.00635L8.1959 10.0791C8.33132 10.2145 8.49636 10.2822 8.69102 10.2822C8.79681 10.2822 8.89838 10.259 8.99571 10.2124C9.09304 10.1659 9.17556 10.1003 9.24327 10.0156L15.8639 1.62402C15.9358 1.53939 15.9718 1.43994 15.9718 1.32568C15.9718 1.1818 15.9125 1.05697 15.794 0.951172L15.4386 0.678223C15.3582 0.610514 15.2587 0.57666 15.1402 0.57666C14.9964 0.57666 14.8715 0.635905 14.7657 0.754395L8.6212 8.32715Z" fill="currentColor"></path></svg></span></div>'}
</div></div></div></div><span class=""></span><div class="_amlr"></div></div><div class="x1c4vz4f xs83m0k xdl72j9 x1g77sc7 x78zum5 xozqiw3 x1oa3qoh x12fk4p8 xeuugli x2lwn1j ${bottomDivClass} x1q0g3np x6s0dn4 _amj_"><div class="x1c4vz4f xs83m0k xdl72j9 x1g77sc7 xeuugli x2lwn1j xozqiw3 x1oa3qoh x12fk4p8 xexx8yu x1im30kd x18d9i69 x1djpfga"><div></div></div></div><span aria-label="This is an auto-delete message"></span></div><div class="x78zum5 xbfrwjf x8k05lb xeq5yr9 x1n2onr6 ${bottomClass}"></div></div></div></div></div></div></div>`;
    
    return html;
}

// 生成Telegram消息HTML
function generateTelegramMessageHTML(msg, customerName, index, conversation) {
    const isCustomer = msg.sender === 'customer';
    const messageId = 1000 + index; // Telegram消息ID
    
    // 判断是否是同一条消息组的第一条和最后一条
    const prevMsg = index > 0 ? conversation[index - 1] : null;
    const nextMsg = index < conversation.length - 1 ? conversation[index + 1] : null;
    const isFirstInGroup = !prevMsg || prevMsg.sender !== msg.sender;
    const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender;
    
    // 构建消息class
    let messageClasses = 'shown open Message message-list-item allow-selection';
    if (isFirstInGroup) {
        messageClasses += ' first-in-group';
    }
    if (isLastInGroup) {
        messageClasses += ' last-in-group';
    }
    if (!isCustomer) {
        messageClasses += ' own';
    }
    
    // 转换时间格式：从 "10/15 10:30" 转换为 "17:22" (24小时制)
    const timeParts = parseTime(msg.time);
    const timeDisplay = timeParts.timeOnly; // 如 "17:22"
    
    // 转义HTML
    const escapedText = escapeHtml(msg.text);
    
    // 生成唯一的filter ID，避免重复
    const filterId = `messageAppendix${messageId}`;
    
    // 只有最后一条消息才显示尾巴（appendix）
    const showAppendix = isLastInGroup;
    
    // 公司消息（own）的HTML结构
    if (!isCustomer) {
        const appendixHtml = showAppendix ? `<svg width="9" height="20" class="svg-appendix"><defs><filter x="-50%" y="-14.7%" width="200%" height="141.2%" filterUnits="objectBoundingBox" id="${filterId}"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feGaussianBlur stdDeviation="1" in="shadowOffsetOuter1" result="shadowBlurOuter1"></feGaussianBlur><feColorMatrix values="0 0 0 0 0.0621962482 0 0 0 0 0.138574144 0 0 0 0 0.185037364 0 0 0 0.15 0" in="shadowBlurOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><path d="M6 17H0V0c.193 2.84.876 5.767 2.05 8.782.904 2.325 2.446 4.485 4.625 6.48A1 1 0 016 17z" fill="#000" filter="url(#${filterId})"></path><path d="M6 17H0V0c.193 2.84.876 5.767 2.05 8.782.904 2.325 2.446 4.485 4.625 6.48A1 1 0 016 17z" fill="#EEFFDE" class="corner"></path></g></svg>` : '';
        const hasAppendixClass = showAppendix ? 'has-appendix' : '';
        return `<div id="message-${messageId}" class="${messageClasses}" data-message-id="${messageId}"><div class="bottom-marker" data-message-id="${messageId}" data-should-update-views="false"></div><div class="message-select-control no-selection"></div><div class="message-content-wrapper can-select-text"><div class="message-content peer-color-count-1 text has-shadow has-solid-background ${hasAppendixClass} has-footer" dir="auto" style=""><div class="content-inner" dir="auto"><div class="text-content clearfix with-meta with-outgoing-icon" dir="auto">${escapedText}<span class="MessageMeta" dir="ltr" data-ignore-on-paste="true"><span class="message-time">${timeDisplay}</span><div class="MessageOutgoingStatus"><div class="Transition"><div class="Transition_slide Transition_slide-active"><i class="icon icon-message-read" aria-hidden="true"></i></div></div></div></span></div></div><div class="message-action-buttons"></div>${appendixHtml}</div></div></div>`;
    } else {
        // 客户消息的HTML结构（没有own类，没有MessageOutgoingStatus，尾巴在左边）
        const filterIdIn = `messageAppendixIn${messageId}`;
        // 客户消息的尾巴路径：使用真实的Telegram接收消息路径（从左边延伸）
        // 真实路径：M3 17h6V0c-.193 2.84-.876 5.767-2.05 8.782-.904 2.325-2.446 4.485-4.625 6.48A1 1 0 003 17z
        const appendixHtml = showAppendix ? `<svg width="9" height="20" class="svg-appendix"><defs><filter x="-50%" y="-14.7%" width="200%" height="141.2%" filterUnits="objectBoundingBox" id="${filterIdIn}"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feGaussianBlur stdDeviation="1" in="shadowOffsetOuter1" result="shadowBlurOuter1"></feGaussianBlur><feColorMatrix values="0 0 0 0 0.0621962482 0 0 0 0 0.138574144 0 0 0 0 0.185037364 0 0 0 0.15 0" in="shadowBlurOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><path d="M3 17h6V0c-.193 2.84-.876 5.767-2.05 8.782-.904 2.325-2.446 4.485-4.625 6.48A1 1 0 003 17z" fill="#000" filter="url(#${filterIdIn})"></path><path d="M3 17h6V0c-.193 2.84-.876 5.767-2.05 8.782-.904 2.325-2.446 4.485-4.625 6.48A1 1 0 003 17z" fill="#FFF" class="corner"></path></g></svg>` : '';
        const hasAppendixClass = showAppendix ? 'has-appendix' : '';
        return `<div id="message-${messageId}" class="${messageClasses}" data-message-id="${messageId}"><div class="bottom-marker" data-message-id="${messageId}" data-should-update-views="false"></div><div class="message-select-control no-selection"></div><div class="message-content-wrapper can-select-text"><div class="message-content peer-color-count-1 text has-shadow has-solid-background ${hasAppendixClass} has-footer" dir="auto" style=""><div class="content-inner" dir="auto"><div class="text-content clearfix with-meta" dir="auto">${escapedText}<span class="MessageMeta" dir="ltr" data-ignore-on-paste="true"><span class="message-time">${timeDisplay}</span></span></div></div><div class="message-action-buttons"></div>${appendixHtml}</div></div></div>`;
    }
}

// 生成随机ID
function generateRandomId() {
    return Math.random().toString(36).substring(2, 18).toUpperCase();
}

// 转义HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 解析时间格式：从 "10/15 10:30" 转换为 WhatsApp 格式（英文）
function parseTime(timeStr) {
    // timeStr 格式: "10/15 10:30"
    const parts = timeStr.split(' ');
    const datePart = parts[0]; // "10/15"
    const timePart = parts[1]; // "10:30"
    
    const [month, day] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    
    const hourNum = parseInt(hour);
    const isAM = hourNum < 12;
    // 小时格式：0点显示为12，1-11显示原样，12点显示为12，13-23显示为1-11
    let displayHour;
    if (hourNum === 0) {
        displayHour = 12;
    } else if (hourNum === 12) {
        displayHour = 12;
    } else if (hourNum > 12) {
        displayHour = hourNum - 12;
    } else {
        displayHour = hourNum;
    }
    
    const period = isAM ? 'AM' : 'PM';
    // 时间显示格式：如 "2:12 AM" 或 "10:30 PM"
    const timeDisplay = `${displayHour}:${minute} ${period}`;
    
    // 假设年份是2025（可以根据需要调整）
    const year = 2025;
    // 完整时间格式："[2:12 AM, 9/12/2025]"
    const timeFull = `[${timeDisplay}, ${month}/${day}/${year}]`;
    
    // Telegram格式：只需要时间，如 "17:22"
    const timeOnly = `${hour.padStart(2, '0')}:${minute}`;
    
    return {
        display: timeDisplay,
        full: timeFull,
        timeOnly: timeOnly
    };
}

function copyScript() {
    const scriptCode = document.getElementById('scriptCode').textContent;
    
    // 使用更兼容的复制方法
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(scriptCode).then(() => {
            showCopySuccess();
        }).catch(err => {
            console.error('复制失败:', err);
            // 降级到传统方法
            fallbackCopy(scriptCode);
        });
    } else {
        // 浏览器不支持clipboard API，使用传统方法
        fallbackCopy(scriptCode);
    }
}

function fallbackCopy(text) {
    // 创建临时textarea元素
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess();
        } else {
            alert('复制失败，请手动选择并复制代码');
        }
    } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动选择并复制代码');
    } finally {
        document.body.removeChild(textarea);
    }
}

function showCopySuccess() {
    const btn = document.querySelector('.copy-btn');
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '已复制！';
        btn.style.background = '#28a745';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#28a745';
        }, 2000);
    }
}

// ========== KYC补充材料场景对话生成函数 ==========

// 话多型KYC对话
function generateVerboseKYCConversation(customerName, customerAge, platform, additionalInfo, willProvide, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    messages.push({
        sender: 'company',
        text: `Hello ${customerName}, I hope you're doing well. We're conducting an enhanced KYC review for your account to ensure your protection and compliance with regulations.`,
        time: formatTimeWithRange(day1, 10, 30)
    });

    messages.push({
        sender: 'customer',
        text: `Hi, what do you need from me?`,
        time: formatTimeWithRange(day1, 10, 33)
    });

    messages.push({
        sender: 'company',
        text: `As part of our enhanced due diligence process, we need to request your bank statements for the last 2-3 months. This helps us verify your source of funds and ensure everything is in order.`,
        time: formatTimeWithRange(day1, 10, 36)
    });

    if (willProvide) {
        // 根据variant生成不同的对话变体
        const variants = [
            // 变体0：客户询问细节较多
            () => {
        messages.push({
            sender: 'customer',
            text: `Okay, I understand. I can provide that. Should I send them via email or upload them somewhere?`,
                    time: formatTimeWithRange(day1, 10, 40)
        });
        messages.push({
            sender: 'company',
            text: `You can send them via email to compliance@geoswift.com. Please make sure they're clear and include all pages. Thank you for your cooperation!`,
                    time: formatTimeWithRange(day1, 10, 43)
        });
        messages.push({
            sender: 'customer',
                    text: `Got it. Do you need statements from all my accounts or just the main one?`,
                    time: formatTimeWithRange(day1, 10, 46)
                });
                messages.push({
                    sender: 'company',
                    text: `We need statements from all accounts that you'll be using for transactions with us. This helps us get a complete picture of your financial activity.`,
                    time: formatTimeWithRange(day1, 10, 49)
                });
                messages.push({
                    sender: 'customer',
                    text: `Alright, I have accounts at two different banks. Should I send them separately or together?`,
                    time: formatTimeWithRange(day1, 10, 52)
                });
                messages.push({
                    sender: 'company',
                    text: `You can send them together in one email, or separately if that's easier for you. Just make sure each statement is clearly labeled with the bank name and account number.`,
                    time: formatTimeWithRange(day1, 10, 55)
                });
                messages.push({
                    sender: 'customer',
                    text: `Perfect. And what format do you prefer? PDF is easiest for me.`,
                    time: formatTimeWithRange(day1, 10, 58)
                });
                messages.push({
                    sender: 'company',
                    text: `PDF is perfect! That's actually our preferred format. Just make sure the scans are clear and all pages are included, especially if there are multiple pages per statement.`,
                    time: formatTimeWithRange(day1, 11, 1)
                });
                messages.push({
                    sender: 'customer',
                    text: `No problem. I'll get them scanned and send them over today. How long does the review usually take once you receive them?`,
                    time: formatTimeWithRange(day1, 11, 4)
                });
                messages.push({
                    sender: 'company',
                    text: `Typically, our compliance team reviews everything within 2-3 business days. We'll send you a confirmation email once we receive the documents, and then another update once the review is complete.`,
                    time: formatTimeWithRange(day1, 11, 7)
                });
                messages.push({
                    sender: 'customer',
                    text: `That sounds reasonable. I'll make sure to send everything today so the process can move forward quickly.`,
                    time: formatTimeWithRange(day1, 11, 10)
                });
                messages.push({
                    sender: 'company',
                    text: `Thank you so much for your cooperation, ${customerName}. We really appreciate it. If you have any questions while preparing the documents, feel free to reach out.`,
                    time: formatTimeWithRange(day1, 11, 13)
                });
            },
            // 变体1：客户确认后询问时间要求
            () => {
                messages.push({
                    sender: 'customer',
                    text: `Sure, I can provide those. Is there a deadline for submitting them?`,
                    time: formatTimeWithRange(day1, 10, 40)
                });
                messages.push({
                    sender: 'company',
                    text: `We'd appreciate it if you could send them within the next 5 business days. This helps us complete the review process without delay.`,
                    time: formatTimeWithRange(day1, 10, 43)
                });
                messages.push({
                    sender: 'customer',
                    text: `That should be fine. I'll need to request them from my bank first. Do you accept statements downloaded from online banking, or do they need to be stamped by the bank?`,
                    time: formatTimeWithRange(day1, 10, 46)
                });
                messages.push({
                    sender: 'company',
                    text: `Online banking statements are perfectly acceptable, as long as they show your name, account number, and the transaction history clearly. They don't need to be stamped.`,
                    time: formatTimeWithRange(day1, 10, 49)
                });
                messages.push({
                    sender: 'customer',
                    text: `Great, that makes it much easier. I can download them right now. Should I send them all in one email?`,
                    time: formatTimeWithRange(day1, 10, 52)
                });
                messages.push({
                    sender: 'company',
                    text: `Yes, one email is perfect. Send them to compliance@geoswift.com. Please include your account number or reference number in the subject line if possible - it helps us process them faster.`,
                    time: formatTimeWithRange(day1, 10, 55)
                });
                messages.push({
                    sender: 'customer',
                    text: `Will do. I'll include my account reference number in the subject line. Is there anything else you need from me at this stage?`,
                    time: formatTimeWithRange(day1, 10, 58)
                });
                messages.push({
                    sender: 'company',
                    text: `That should be all for now. Once we receive and review the statements, we'll let you know if we need anything additional. Most of the time, these statements are sufficient.`,
                    time: formatTimeWithRange(day1, 11, 1)
                });
                messages.push({
                    sender: 'customer',
                    text: `Perfect. I'll get this done today. Thanks for being so clear about what's needed.`,
                    time: formatTimeWithRange(day1, 11, 4)
                });
                messages.push({
                    sender: 'company',
                    text: `You're very welcome! We're here to help make this process as smooth as possible. Don't hesitate to reach out if anything comes up.`,
                    time: formatTimeWithRange(day1, 11, 7)
                });
                messages.push({
                    sender: 'customer',
                    text: `I appreciate that. One more question - will I receive updates during the review process?`,
                    time: formatTimeWithRange(day1, 11, 10)
                });
                messages.push({
                    sender: 'company',
                    text: `Yes, absolutely. We'll send you a confirmation email when we receive the documents, and then another update once the review is complete. If we need anything additional, we'll contact you right away.`,
                    time: formatTimeWithRange(day1, 11, 13)
                });
            },
            // 变体2：客户确认后询问隐私和安全
            () => {
                messages.push({
                    sender: 'customer',
                    text: `I understand. I can provide the bank statements, but I want to make sure my information will be secure. How do you handle sensitive financial documents?`,
                    time: formatTimeWithRange(day1, 10, 40)
                });
                messages.push({
                    sender: 'company',
                    text: `Absolutely, and I'm glad you're asking. All documents are encrypted both in transit and at rest. We use bank-level security protocols, and only authorized compliance staff have access to them. They're stored securely and deleted according to our data retention policy.`,
                    time: formatTimeWithRange(day1, 10, 43)
                });
                messages.push({
                    sender: 'customer',
                    text: `That's reassuring. And you won't share this information with third parties, right?`,
                    time: formatTimeWithRange(day1, 10, 46)
                });
                messages.push({
                    sender: 'company',
                    text: `Correct. We only share information when legally required, such as with regulatory authorities for compliance purposes. We never sell or share your data with marketing companies or other third parties.`,
                    time: formatTimeWithRange(day1, 10, 49)
                });
                messages.push({
                    sender: 'customer',
                    text: `Good to know. What about data breaches? Do you have insurance coverage?`,
                    time: formatTimeWithRange(day1, 10, 52)
                });
                messages.push({
                    sender: 'company',
                    text: `Yes, we have comprehensive cyber insurance and follow industry best practices. We've never had a breach, but we're fully prepared with protocols if one were to occur.`,
                    time: formatTimeWithRange(day1, 10, 55)
                });
                messages.push({
                    sender: 'customer',
                    text: `That's good to hear. Alright, I'll send them over. What's the email address again?`,
                    time: formatTimeWithRange(day1, 10, 58)
                });
                messages.push({
                    sender: 'company',
                    text: `compliance@geoswift.com. And please make sure the statements cover the last 2-3 months and include all pages.`,
                    time: formatTimeWithRange(day1, 11, 1)
                });
                messages.push({
                    sender: 'customer',
                    text: `Got it. I'll send them within the next day or two. Will I receive a confirmation when you get them?`,
                    time: formatTimeWithRange(day1, 11, 4)
                });
                messages.push({
                    sender: 'company',
                    text: `Yes, we'll send you an automated confirmation email as soon as we receive them. Then our team will review everything and get back to you within 2-3 business days.`,
                    time: formatTimeWithRange(day1, 11, 7)
                });
                messages.push({
                    sender: 'customer',
                    text: `Perfect. Thanks for answering all my questions. I'll get those statements sent over soon.`,
                    time: formatTimeWithRange(day1, 11, 10)
                });
                messages.push({
                    sender: 'company',
                    text: `Thank you, ${customerName}. We appreciate your cooperation and patience with this process.`,
                    time: formatTimeWithRange(day1, 11, 13)
                });
            },
            // 变体3：客户快速同意，询问后续步骤
            () => {
                messages.push({
                    sender: 'customer',
                    text: `No problem, I can provide those. Where should I send them?`,
                    time: formatTimeWithRange(day1, 10, 40)
                });
                messages.push({
                    sender: 'company',
                    text: `You can email them to compliance@geoswift.com. Please make sure they're clear and include all pages from the last 2-3 months.`,
                    time: formatTimeWithRange(day1, 10, 43)
                });
                messages.push({
                    sender: 'customer',
                    text: `Okay, I'll send them today. What happens after you receive them?`,
                    time: formatTimeWithRange(day1, 10, 46)
                });
                messages.push({
                    sender: 'company',
                    text: `Our compliance team will review them, which usually takes 2-3 business days. Once approved, your account will be fully verified and you can proceed with your transactions.`,
                    time: formatTimeWithRange(day1, 10, 49)
                });
                messages.push({
                    sender: 'customer',
                    text: `Sounds good. And if there are any issues or you need more information, you'll let me know, right?`,
                    time: formatTimeWithRange(day1, 10, 52)
                });
                messages.push({
                    sender: 'company',
                    text: `Absolutely. We'll contact you immediately if we need any clarification or additional documents. Most of the time, everything goes smoothly.`,
                    time: formatTimeWithRange(day1, 10, 55)
                });
                messages.push({
                    sender: 'customer',
                    text: `That's reassuring. What format should the statements be in? PDF is easiest for me.`,
                    time: formatTimeWithRange(day1, 10, 58)
                });
                messages.push({
                    sender: 'company',
                    text: `PDF is perfect! That's our preferred format. Just make sure all pages are included and the scans are clear and readable.`,
                    time: formatTimeWithRange(day1, 11, 1)
                });
                messages.push({
                    sender: 'customer',
                    text: `Got it. I'll make sure everything is clear and complete. Should I include anything specific in the email subject line?`,
                    time: formatTimeWithRange(day1, 11, 4)
                });
                messages.push({
                    sender: 'company',
                    text: `It would be helpful if you could include your account reference number or your name in the subject line. That helps us process everything more efficiently.`,
                    time: formatTimeWithRange(day1, 11, 7)
                });
                messages.push({
                    sender: 'customer',
                    text: `Perfect. I'll get those sent over right away. Thanks for the quick response and clear instructions.`,
                    time: formatTimeWithRange(day1, 11, 10)
                });
                messages.push({
                    sender: 'company',
                    text: `Thank you for your cooperation! We'll be in touch soon with confirmation and updates.`,
                    time: formatTimeWithRange(day1, 11, 13)
                });
            },
            // 变体4：客户需要时间准备，询问具体要求
            () => {
                messages.push({
                    sender: 'customer',
                    text: `I understand. I'll need a couple of days to get those together. Are there any specific requirements I should know about?`,
                    time: formatTimeWithRange(day1, 10, 40)
                });
                messages.push({
                    sender: 'company',
                    text: `Of course, take your time. The statements need to show your name, account number, and transaction history for the last 2-3 months. PDF format is preferred, and make sure all pages are included.`,
                    time: formatTimeWithRange(day1, 10, 43)
                });
                messages.push({
                    sender: 'customer',
                    text: `Okay. What if my statements are in a different language? Will that be a problem?`,
                    time: formatTimeWithRange(day1, 10, 46)
                });
                messages.push({
                    sender: 'company',
                    text: `Not at all. We can work with statements in any language. Our team is multilingual and can review documents in various languages.`,
                    time: formatTimeWithRange(day1, 10, 49)
                });
                messages.push({
                    sender: 'customer',
                    text: `Great. And should I send statements from all my accounts, or just the one I'll be using for transactions?`,
                    time: formatTimeWithRange(day1, 10, 52)
                });
                messages.push({
                    sender: 'company',
                    text: `We need statements from all accounts that will be used for transactions with us. This gives us a complete view of your financial activity and helps with the verification process.`,
                    time: formatTimeWithRange(day1, 10, 55)
                });
                messages.push({
                    sender: 'customer',
                    text: `Understood. I'll gather everything and send it to compliance@geoswift.com, right?`,
                    time: formatTimeWithRange(day1, 10, 58)
                });
                messages.push({
                    sender: 'company',
                    text: `That's correct. We appreciate you taking the time to provide these documents. Once we receive them, we'll review everything and get back to you within 2-3 business days.`,
                    time: formatTimeWithRange(day1, 11, 1)
                });
                messages.push({
                    sender: 'customer',
                    text: `Good to know. What happens if the statements don't meet your requirements? Will you ask me to resubmit?`,
                    time: formatTimeWithRange(day1, 11, 4)
                });
                messages.push({
                    sender: 'company',
                    text: `If there are any issues, we'll contact you right away to clarify what's needed. Most of the time, as long as the statements are clear and complete, everything goes smoothly.`,
                    time: formatTimeWithRange(day1, 11, 7)
                });
                messages.push({
                    sender: 'customer',
                    text: `Perfect. I'll make sure to send everything by the end of the week. Thanks for your help and patience.`,
                    time: formatTimeWithRange(day1, 11, 10)
                });
                messages.push({
                    sender: 'company',
                    text: `Thank you, ${customerName}. We look forward to receiving the documents and completing your account verification.`,
                    time: formatTimeWithRange(day1, 11, 13)
                });
            }
        ];
        
        const selectedVariant = variants[variant % variants.length];
        selectedVariant();
    } else {
        const refusalReason = generateRefusalReason(customerName);
        messages.push({
            sender: 'customer',
            text: refusalReason.text,
            time: formatTimeWithRange(day1, 10, 40)
        });

        messages.push({
            sender: 'company',
            text: `I completely understand your concerns. This is a standard requirement for enhanced due diligence, especially for accounts with certain risk profiles. We take data security very seriously - all documents are encrypted and stored securely.`,
            time: formatTimeWithRange(day1, 10, 44)
        });

        messages.push({
            sender: 'customer',
            text: `But why specifically for people over 60? That doesn't seem fair.`,
            time: formatTimeWithRange(day1, 10, 48)
        });

        messages.push({
            sender: 'company',
            text: `I understand how this might feel. It's not about age discrimination - it's about ensuring we have adequate protection measures for all our clients. This is a regulatory requirement to help prevent fraud and protect your interests.`,
            time: formatTimeWithRange(day1, 10, 52)
        });

        messages.push({
            sender: 'customer',
            text: `I'm still not comfortable with this. Is there really no alternative?`,
            time: formatTimeWithRange(day1, 10, 56)
        });

        messages.push({
            sender: 'company',
            text: `I appreciate your position. Unfortunately, this is a mandatory requirement for account verification. Without these documents, we won't be able to proceed with your account. However, I can assure you that your information will be handled with the utmost confidentiality.`,
            time: formatTimeWithRange(day1, 11, 0)
        });

        
        messages.push({
            sender: 'customer',
            text: `Let me think about this. I'll need to discuss it with my family first.`,
            time: formatTimeWithRange(day2, 14, 20)
        });

        messages.push({
            sender: 'company',
            text: `Of course, take your time. We're here to answer any questions you might have. Please let us know when you've made a decision.`,
            time: formatTimeWithRange(day2, 14, 23)
        });
    }

    return messages;
}

// 话少型KYC对话
function generateConciseKYCConversation(customerName, customerAge, platform, additionalInfo, willProvide, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    messages.push({
        sender: 'company',
        text: `Hi ${customerName}, we need bank statements for the last 2-3 months for enhanced KYC.`,
        time: formatTimeWithRange(day1, 11, 0)
    });

    if (willProvide) {
        const variants = [
            () => {
                messages.push({ sender: 'customer', text: `Okay, where should I send them?`, time: formatTimeWithRange(day1, 11, 3) });
                messages.push({ sender: 'company', text: `Email to compliance@geoswift.com. Thanks.`, time: formatTimeWithRange(day1, 11, 5) });
                messages.push({ sender: 'customer', text: `Got it. PDF format okay?`, time: formatTimeWithRange(day1, 11, 7) });
                messages.push({ sender: 'company', text: `Yes, PDF is perfect.`, time: formatTimeWithRange(day1, 11, 9) });
                messages.push({ sender: 'customer', text: `Sending them now.`, time: formatTimeWithRange(day1, 11, 11) });
                messages.push({ sender: 'company', text: `Received. We'll review within 2-3 days.`, time: formatTimeWithRange(day1, 11, 13) });
                messages.push({ sender: 'customer', text: `Thanks.`, time: formatTimeWithRange(day1, 11, 15) });
            },
            () => {
                messages.push({ sender: 'customer', text: `Sure. Email address?`, time: formatTimeWithRange(day1, 11, 3) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com`, time: formatTimeWithRange(day1, 11, 5) });
                messages.push({ sender: 'customer', text: `How many months?`, time: formatTimeWithRange(day1, 11, 7) });
                messages.push({ sender: 'company', text: `2-3 months.`, time: formatTimeWithRange(day1, 11, 9) });
                messages.push({ sender: 'customer', text: `Will send today.`, time: formatTimeWithRange(day1, 11, 11) });
                messages.push({ sender: 'company', text: `Appreciate it.`, time: formatTimeWithRange(day1, 11, 13) });
            },
            () => {
                messages.push({ sender: 'customer', text: `No problem. Where to send?`, time: formatTimeWithRange(day1, 11, 3) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com`, time: formatTimeWithRange(day1, 11, 5) });
                messages.push({ sender: 'customer', text: `All pages needed?`, time: formatTimeWithRange(day1, 11, 7) });
                messages.push({ sender: 'company', text: `Yes, all pages please.`, time: formatTimeWithRange(day1, 11, 9) });
                messages.push({ sender: 'customer', text: `Okay, sending now.`, time: formatTimeWithRange(day1, 11, 11) });
                messages.push({ sender: 'company', text: `Thanks. Review takes 2-3 days.`, time: formatTimeWithRange(day1, 11, 13) });
            },
            () => {
                messages.push({ sender: 'customer', text: `Okay. Email?`, time: formatTimeWithRange(day1, 11, 3) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com`, time: formatTimeWithRange(day1, 11, 5) });
                messages.push({ sender: 'customer', text: `When do you need them?`, time: formatTimeWithRange(day1, 11, 7) });
                messages.push({ sender: 'company', text: `Within 5 days is fine.`, time: formatTimeWithRange(day1, 11, 9) });
                messages.push({ sender: 'customer', text: `Will send by tomorrow.`, time: formatTimeWithRange(day1, 11, 11) });
                messages.push({ sender: 'company', text: `Perfect. Thanks.`, time: formatTimeWithRange(day1, 11, 13) });
            },
            () => {
                messages.push({ sender: 'customer', text: `Can do. Where?`, time: formatTimeWithRange(day1, 11, 3) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com`, time: formatTimeWithRange(day1, 11, 5) });
                messages.push({ sender: 'customer', text: `PDF okay?`, time: formatTimeWithRange(day1, 11, 7) });
                messages.push({ sender: 'company', text: `Yes, PDF preferred.`, time: formatTimeWithRange(day1, 11, 9) });
                messages.push({ sender: 'customer', text: `Sending shortly.`, time: formatTimeWithRange(day1, 11, 11) });
                messages.push({ sender: 'company', text: `Great. We'll confirm receipt.`, time: formatTimeWithRange(day1, 11, 13) });
            }
        ];
        const selectedVariant = variants[variant % variants.length];
        selectedVariant();
    } else {
        const refusalReason = generateRefusalReason(customerName);
        messages.push({
            sender: 'customer',
            text: refusalReason.text,
            time: formatTimeWithRange(day1, 11, 3)
        });

        messages.push({
            sender: 'company',
            text: `I understand, but this is required for compliance. Your data is secure.`,
            time: formatTimeWithRange(day1, 11, 6)
        });

        messages.push({
            sender: 'customer',
            text: `I'll think about it.`,
            time: formatTimeWithRange(day1, 11, 9)
        });
    }

    return messages;
}

// 谨慎型KYC对话
function generateCautiousKYCConversation(customerName, customerAge, platform, additionalInfo, willProvide, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    messages.push({
        sender: 'company',
        text: `Hello ${customerName}, we're conducting an enhanced KYC review. We need your bank statements for the last 2-3 months to verify source of funds.`,
        time: formatTimeWithRange(day1, 9, 30)
    });

    if (willProvide) {
        const variants = [
            () => {
                messages.push({ sender: 'customer', text: `I understand. What security measures do you have in place for storing these documents?`, time: formatTimeWithRange(day1, 9, 33) });
                messages.push({ sender: 'company', text: `All documents are encrypted and stored in secure, compliant systems. We follow strict data protection protocols and comply with GDPR and other regulations.`, time: formatTimeWithRange(day1, 9, 36) });
                messages.push({ sender: 'customer', text: `And who has access to these documents?`, time: formatTimeWithRange(day1, 9, 39) });
                messages.push({ sender: 'company', text: `Only authorized compliance staff have access, and all access is logged and monitored. We never share documents with third parties unless legally required.`, time: formatTimeWithRange(day1, 9, 42) });
                messages.push({ sender: 'customer', text: `Okay, that's reassuring. How should I send them?`, time: formatTimeWithRange(day1, 9, 45) });
                messages.push({ sender: 'company', text: `Please email them to compliance@geoswift.com. Make sure they're password-protected if possible, or we can provide a secure upload link.`, time: formatTimeWithRange(day1, 9, 48) });
                messages.push({ sender: 'customer', text: `A secure upload link would be better. Can you send that?`, time: formatTimeWithRange(day1, 9, 51) });
                messages.push({ sender: 'company', text: `Of course. I'll send you a secure link via email. It will expire after 24 hours for security.`, time: formatTimeWithRange(day1, 9, 54) });
                messages.push({ sender: 'customer', text: `Perfect. And how long will you keep these documents?`, time: formatTimeWithRange(day1, 9, 57) });
                messages.push({ sender: 'company', text: `We retain them according to regulatory requirements, typically 5-7 years, then they're securely deleted.`, time: formatTimeWithRange(day1, 10, 0) });
                messages.push({ sender: 'customer', text: `I see. I'll upload them once I receive the link.`, time: formatTimeWithRange(day1, 10, 3) });
                messages.push({ sender: 'company', text: `Thank you for your cooperation. We'll send the link shortly.`, time: formatTimeWithRange(day1, 10, 6) });
            },
            () => {
                messages.push({ sender: 'customer', text: `I can provide them, but I want to make sure my information is protected. What encryption do you use?`, time: formatTimeWithRange(day1, 9, 33) });
                messages.push({ sender: 'company', text: `We use AES-256 encryption, which is bank-level security. All data is encrypted both in transit and at rest.`, time: formatTimeWithRange(day1, 9, 36) });
                messages.push({ sender: 'customer', text: `And what about data breaches? Do you have insurance?`, time: formatTimeWithRange(day1, 9, 39) });
                messages.push({ sender: 'company', text: `Yes, we have comprehensive cyber insurance and follow industry best practices. We've never had a breach, but we're fully prepared if one were to occur.`, time: formatTimeWithRange(day1, 9, 42) });
                messages.push({ sender: 'customer', text: `That's good to know. Where should I send the statements?`, time: formatTimeWithRange(day1, 9, 45) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com. You can password-protect the PDF if you'd like for extra security.`, time: formatTimeWithRange(day1, 9, 48) });
                messages.push({ sender: 'customer', text: `I'll do that. How will I know you've received them?`, time: formatTimeWithRange(day1, 9, 51) });
                messages.push({ sender: 'company', text: `We'll send an automated confirmation email immediately upon receipt.`, time: formatTimeWithRange(day1, 9, 54) });
                messages.push({ sender: 'customer', text: `Good. I'll send them today with password protection.`, time: formatTimeWithRange(day1, 9, 57) });
                messages.push({ sender: 'company', text: `Thank you. We'll send you the password confirmation separately for security.`, time: formatTimeWithRange(day1, 10, 0) });
            },
            () => {
                messages.push({ sender: 'customer', text: `I understand the requirement. Before I send them, can you tell me about your data retention policy?`, time: formatTimeWithRange(day1, 9, 33) });
                messages.push({ sender: 'company', text: `We retain documents per regulatory requirements, typically 5-7 years. After that, they're securely destroyed. We never use them for marketing or share them unnecessarily.`, time: formatTimeWithRange(day1, 9, 36) });
                messages.push({ sender: 'customer', text: `And if I want my data deleted earlier, is that possible?`, time: formatTimeWithRange(day1, 9, 39) });
                messages.push({ sender: 'company', text: `We can discuss that after the verification is complete, though regulatory requirements may require us to retain certain documents.`, time: formatTimeWithRange(day1, 9, 42) });
                messages.push({ sender: 'customer', text: `I see. Alright, I'll send them. What's the email?`, time: formatTimeWithRange(day1, 9, 45) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com. Please include your account reference number in the subject line.`, time: formatTimeWithRange(day1, 9, 48) });
                messages.push({ sender: 'customer', text: `Will do. I'll send them within the next day or two.`, time: formatTimeWithRange(day1, 9, 51) });
                messages.push({ sender: 'company', text: `Thank you. We appreciate your cooperation with this process.`, time: formatTimeWithRange(day1, 9, 54) });
            },
            () => {
                messages.push({ sender: 'customer', text: `Okay, I can provide them. But I want confirmation that you follow GDPR and other privacy laws.`, time: formatTimeWithRange(day1, 9, 33) });
                messages.push({ sender: 'company', text: `Absolutely. We're fully GDPR compliant and follow all applicable privacy laws. You have the right to access, correct, or delete your data subject to regulatory requirements.`, time: formatTimeWithRange(day1, 9, 36) });
                messages.push({ sender: 'customer', text: `Good. How should I send the statements?`, time: formatTimeWithRange(day1, 9, 39) });
                messages.push({ sender: 'company', text: `Email to compliance@geoswift.com. PDF format preferred.`, time: formatTimeWithRange(day1, 9, 42) });
                messages.push({ sender: 'customer', text: `I'll send them today. Will I get a receipt confirmation?`, time: formatTimeWithRange(day1, 9, 45) });
                messages.push({ sender: 'company', text: `Yes, automated confirmation will be sent immediately.`, time: formatTimeWithRange(day1, 9, 48) });
                messages.push({ sender: 'customer', text: `Perfect. Thanks for the information.`, time: formatTimeWithRange(day1, 9, 51) });
                messages.push({ sender: 'company', text: `You're welcome. We'll be in touch once we've reviewed everything.`, time: formatTimeWithRange(day1, 9, 54) });
            },
            () => {
                messages.push({ sender: 'customer', text: `I understand. Can you send me your privacy policy first so I can review it?`, time: formatTimeWithRange(day1, 9, 33) });
                messages.push({ sender: 'company', text: `Of course. I'll send you our privacy policy and data protection documentation right away.`, time: formatTimeWithRange(day1, 9, 36) });
                messages.push({ sender: 'customer', text: `Thank you. Once I've reviewed it, I'll send the statements.`, time: formatTimeWithRange(day1, 9, 39) });
                messages.push({ sender: 'company', text: `Perfect. Take your time. The email address is compliance@geoswift.com when you're ready.`, time: formatTimeWithRange(day1, 9, 42) });
                messages.push({ sender: 'customer', text: `Got it. I'll review the policy and send everything by tomorrow.`, time: formatTimeWithRange(day1, 9, 45) });
                messages.push({ sender: 'company', text: `Thank you. We appreciate your diligence.`, time: formatTimeWithRange(day1, 9, 48) });
            }
        ];
        const selectedVariant = variants[variant % variants.length];
        selectedVariant();
    } else {
        const refusalReason = generateRefusalReason(customerName);
        messages.push({
            sender: 'customer',
            text: refusalReason.text,
            time: formatTimeWithRange(conversationDate, 9, 33)
        });

        messages.push({
            sender: 'company',
            text: `I understand your privacy concerns. We use bank-level encryption and comply with all data protection regulations. This is a regulatory requirement for enhanced due diligence.`,
            time: formatTimeWithRange(conversationDate, 9, 37)
        });

        messages.push({
            sender: 'customer',
            text: `Can you show me your data protection policy? And what happens if there's a breach?`,
            time: formatTimeWithRange(conversationDate, 9, 41)
        });

        messages.push({
            sender: 'company',
            text: `Absolutely. I can send you our privacy policy and data protection documentation. We have comprehensive insurance and protocols in place. However, this documentation is still required for compliance.`,
            time: formatTimeWithRange(conversationDate, 9, 45)
        });

        messages.push({
            sender: 'customer',
            text: `I need to review everything first before making a decision.`,
            time: formatTimeWithRange(conversationDate, 9, 49)
        });

        messages.push({
            sender: 'company',
            text: `Of course. I'll send over the documentation. Please review and let us know your decision.`,
            time: formatTimeWithRange(conversationDate, 9, 52)
        });
    }

    return messages;
}

// 急切型KYC对话
function generateUrgentKYCConversation(customerName, customerAge, platform, additionalInfo, willProvide, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    messages.push({
        sender: 'company',
        text: `Hi ${customerName}, we need your bank statements ASAP - last 2-3 months for KYC.`,
        time: formatTimeWithRange(day1, 14, 0)
    });

    if (willProvide) {
        const variants = [
            () => {
                messages.push({ sender: 'customer', text: `Okay, where do I send them?`, time: formatTimeWithRange(day1, 14, 3) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com. Please send today if possible.`, time: formatTimeWithRange(day1, 14, 5) });
                messages.push({ sender: 'customer', text: `Sending now. How quickly will you review?`, time: formatTimeWithRange(day1, 14, 7) });
                messages.push({ sender: 'company', text: `We'll prioritize it. Should be reviewed within 24-48 hours.`, time: formatTimeWithRange(day1, 14, 9) });
                messages.push({ sender: 'customer', text: `Great, I need this done fast.`, time: formatTimeWithRange(day1, 14, 11) });
                messages.push({ sender: 'company', text: `Understood. We'll expedite the review.`, time: formatTimeWithRange(day1, 14, 13) });
            },
            () => {
                messages.push({ sender: 'customer', text: `No problem. Email address?`, time: formatTimeWithRange(day1, 14, 3) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com. Urgent - please send ASAP.`, time: formatTimeWithRange(day1, 14, 5) });
                messages.push({ sender: 'customer', text: `Sending immediately. When will I hear back?`, time: formatTimeWithRange(day1, 14, 7) });
                messages.push({ sender: 'company', text: `We'll confirm receipt today and review within 24 hours.`, time: formatTimeWithRange(day1, 14, 9) });
                messages.push({ sender: 'customer', text: `Perfect. I've sent them.`, time: formatTimeWithRange(day1, 14, 11) });
                messages.push({ sender: 'company', text: `Received. Processing now.`, time: formatTimeWithRange(day1, 14, 13) });
            },
            () => {
                messages.push({ sender: 'customer', text: `Got it. Where to send?`, time: formatTimeWithRange(day1, 14, 3) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com. Today please.`, time: formatTimeWithRange(day1, 14, 5) });
                messages.push({ sender: 'customer', text: `On it. Can you fast-track the review?`, time: formatTimeWithRange(day1, 14, 7) });
                messages.push({ sender: 'company', text: `Yes, we'll prioritize your case.`, time: formatTimeWithRange(day1, 14, 9) });
                messages.push({ sender: 'customer', text: `Thanks. Sending now.`, time: formatTimeWithRange(day1, 14, 11) });
                messages.push({ sender: 'company', text: `Appreciate the quick response.`, time: formatTimeWithRange(day1, 14, 13) });
            },
            () => {
                messages.push({ sender: 'customer', text: `Sure. Email?`, time: formatTimeWithRange(day1, 14, 3) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com. Urgent.`, time: formatTimeWithRange(day1, 14, 5) });
                messages.push({ sender: 'customer', text: `Sending right away. How long for approval?`, time: formatTimeWithRange(day1, 14, 7) });
                messages.push({ sender: 'company', text: `24-48 hours max. We'll rush it.`, time: formatTimeWithRange(day1, 14, 9) });
                messages.push({ sender: 'customer', text: `Perfect. Done.`, time: formatTimeWithRange(day1, 14, 11) });
                messages.push({ sender: 'company', text: `Got it. Reviewing now.`, time: formatTimeWithRange(day1, 14, 13) });
            },
            () => {
                messages.push({ sender: 'customer', text: `Okay, sending now. Where?`, time: formatTimeWithRange(day1, 14, 3) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com. ASAP please.`, time: formatTimeWithRange(day1, 14, 5) });
                messages.push({ sender: 'customer', text: `Done. When approved?`, time: formatTimeWithRange(day1, 14, 7) });
                messages.push({ sender: 'company', text: `Within 24 hours. We'll notify you immediately.`, time: formatTimeWithRange(day1, 14, 9) });
                messages.push({ sender: 'customer', text: `Great, thanks.`, time: formatTimeWithRange(day1, 14, 11) });
            }
        ];
        const selectedVariant = variants[variant % variants.length];
        selectedVariant();
    } else {
        const refusalReason = generateRefusalReason(customerName);
        messages.push({
            sender: 'customer',
            text: refusalReason.text,
            time: formatTimeWithRange(conversationDate, 8, 18)
        });

        messages.push({
            sender: 'company',
            text: `I understand, but this is mandatory. Without it, we can't proceed.`,
            time: formatTimeWithRange(conversationDate, 8, 21)
        });

        messages.push({
            sender: 'customer',
            text: `This is ridiculous. Why do you need this?`,
            time: formatTimeWithRange(conversationDate, 8, 24)
        });

        messages.push({
            sender: 'company',
            text: `It's a regulatory requirement for enhanced due diligence. We need it to verify your account.`,
            time: formatTimeWithRange(conversationDate, 8, 27)
        });

        messages.push({
            sender: 'customer',
            text: `Fine, but I'm not happy about this. I'll send them later today.`,
            time: formatTimeWithRange(conversationDate, 8, 30)
        });
    }

    return messages;
}

// 友好型KYC对话
function generateFriendlyKYCConversation(customerName, customerAge, platform, additionalInfo, willProvide, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    messages.push({
        sender: 'company',
        text: `Hi ${customerName}! Hope you're doing well. We need to do a quick enhanced KYC check - could you provide bank statements for the last 2-3 months?`,
        time: formatTimeWithRange(day1, 10, 15)
    });

    if (willProvide) {
        const variants = [
            () => {
                messages.push({ sender: 'customer', text: `Sure, no problem! How should I send them?`, time: formatTimeWithRange(day1, 10, 18) });
                messages.push({ sender: 'company', text: `You can email them to compliance@geoswift.com. Thanks so much!`, time: formatTimeWithRange(day1, 10, 21) });
                messages.push({ sender: 'customer', text: `Perfect! PDF format okay?`, time: formatTimeWithRange(day1, 10, 24) });
                messages.push({ sender: 'company', text: `Yes, PDF is perfect! Just make sure all pages are included.`, time: formatTimeWithRange(day1, 10, 27) });
                messages.push({ sender: 'customer', text: `Got it! I'll send them over in the next hour.`, time: formatTimeWithRange(day1, 10, 30) });
                messages.push({ sender: 'company', text: `Awesome! We'll review them within 2-3 business days and let you know.`, time: formatTimeWithRange(day1, 10, 33) });
                messages.push({ sender: 'customer', text: `Sounds good! Thanks for making this easy.`, time: formatTimeWithRange(day1, 10, 36) });
                messages.push({ sender: 'company', text: `You're welcome! We're here to help. Have a great day!`, time: formatTimeWithRange(day1, 10, 39) });
            },
            () => {
                messages.push({ sender: 'customer', text: `Absolutely! Where should I send them?`, time: formatTimeWithRange(day1, 10, 18) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com would be great!`, time: formatTimeWithRange(day1, 10, 21) });
                messages.push({ sender: 'customer', text: `Perfect! I'll get them together and send them today.`, time: formatTimeWithRange(day1, 10, 24) });
                messages.push({ sender: 'company', text: `That would be wonderful! We really appreciate your cooperation.`, time: formatTimeWithRange(day1, 10, 27) });
                messages.push({ sender: 'customer', text: `No worries at all! Is there anything specific I should include?`, time: formatTimeWithRange(day1, 10, 30) });
                messages.push({ sender: 'company', text: `Just make sure the statements show your name, account number, and cover the last 2-3 months. That's all we need!`, time: formatTimeWithRange(day1, 10, 33) });
                messages.push({ sender: 'customer', text: `Easy enough! I'll send them shortly.`, time: formatTimeWithRange(day1, 10, 36) });
                messages.push({ sender: 'company', text: `Thank you so much! We'll be in touch once everything's reviewed.`, time: formatTimeWithRange(day1, 10, 39) });
            },
            () => {
                messages.push({ sender: 'customer', text: `Of course! Happy to help. What's the email address?`, time: formatTimeWithRange(day1, 10, 18) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com. You're the best!`, time: formatTimeWithRange(day1, 10, 21) });
                messages.push({ sender: 'customer', text: `Haha, thanks! I'll send them over right now.`, time: formatTimeWithRange(day1, 10, 24) });
                messages.push({ sender: 'company', text: `Perfect! We'll send you a confirmation email once we receive them.`, time: formatTimeWithRange(day1, 10, 27) });
                messages.push({ sender: 'customer', text: `Great! And how long does the review usually take?`, time: formatTimeWithRange(day1, 10, 30) });
                messages.push({ sender: 'company', text: `Typically 2-3 business days. We'll keep you updated throughout the process!`, time: formatTimeWithRange(day1, 10, 33) });
                messages.push({ sender: 'customer', text: `Perfect! Thanks for being so helpful.`, time: formatTimeWithRange(day1, 10, 36) });
                messages.push({ sender: 'company', text: `Our pleasure! Have a wonderful day!`, time: formatTimeWithRange(day1, 10, 39) });
            },
            () => {
                messages.push({ sender: 'customer', text: `Sure thing! How do you want me to send them?`, time: formatTimeWithRange(day1, 10, 18) });
                messages.push({ sender: 'company', text: `Email works great - compliance@geoswift.com. Thank you!`, time: formatTimeWithRange(day1, 10, 21) });
                messages.push({ sender: 'customer', text: `No problem! I'll send them today.`, time: formatTimeWithRange(day1, 10, 24) });
                messages.push({ sender: 'company', text: `That's fantastic! We really appreciate it.`, time: formatTimeWithRange(day1, 10, 27) });
                messages.push({ sender: 'customer', text: `My pleasure! Anything else you need from me?`, time: formatTimeWithRange(day1, 10, 30) });
                messages.push({ sender: 'company', text: `That should be everything for now! We'll let you know if we need anything else.`, time: formatTimeWithRange(day1, 10, 33) });
                messages.push({ sender: 'customer', text: `Sounds good! I'll get those sent over now.`, time: formatTimeWithRange(day1, 10, 36) });
                messages.push({ sender: 'company', text: `Thank you! We'll be in touch soon.`, time: formatTimeWithRange(day1, 10, 39) });
            },
            () => {
                messages.push({ sender: 'customer', text: `Absolutely! Where should I email them?`, time: formatTimeWithRange(day1, 10, 18) });
                messages.push({ sender: 'company', text: `compliance@geoswift.com. You're awesome for being so quick!`, time: formatTimeWithRange(day1, 10, 21) });
                messages.push({ sender: 'customer', text: `Thanks! I'll send them in a bit.`, time: formatTimeWithRange(day1, 10, 24) });
                messages.push({ sender: 'company', text: `Perfect! We'll confirm receipt as soon as we get them.`, time: formatTimeWithRange(day1, 10, 27) });
                messages.push({ sender: 'customer', text: `Great! Looking forward to getting this sorted.`, time: formatTimeWithRange(day1, 10, 30) });
                messages.push({ sender: 'company', text: `Same here! We'll make sure everything goes smoothly.`, time: formatTimeWithRange(day1, 10, 33) });
                messages.push({ sender: 'customer', text: `Perfect! Thanks again.`, time: formatTimeWithRange(day1, 10, 36) });
                messages.push({ sender: 'company', text: `You're very welcome! Have a great day!`, time: formatTimeWithRange(day1, 10, 39) });
            }
        ];
        const selectedVariant = variants[variant % variants.length];
        selectedVariant();
    } else {
        const refusalReason = generateRefusalReason(customerName);
        messages.push({
            sender: 'customer',
            text: refusalReason.text,
            time: formatTimeWithRange(conversationDate, 10, 18)
        });

        messages.push({
            sender: 'company',
            text: `I totally understand your concerns. We take privacy very seriously and all documents are encrypted. This is just a standard compliance requirement.`,
            time: formatTimeWithRange(conversationDate, 10, 22)
        });

        messages.push({
            sender: 'customer',
            text: `I appreciate that, but I'm still not comfortable sharing bank statements. Is there any way around this?`,
            time: formatTimeWithRange(conversationDate, 10, 26)
        });

        messages.push({
            sender: 'company',
            text: `I wish there was, but unfortunately it's mandatory for regulatory compliance. We really need these documents to proceed. Your information will be kept completely confidential.`,
            time: formatTimeWithRange(conversationDate, 10, 30)
        });

        messages.push({
            sender: 'customer',
            text: `Okay, let me think about it. I'll get back to you.`,
            time: formatTimeWithRange(conversationDate, 10, 34)
        });

        messages.push({
            sender: 'company',
            text: `Of course! Take your time. Feel free to reach out if you have any questions.`,
            time: formatTimeWithRange(conversationDate, 10, 37)
        });
    }

    return messages;
}

// 专业型KYC对话
function generateProfessionalKYCConversation(customerName, customerAge, platform, additionalInfo, willProvide, variant = 0, seed = 0) {
    const messages = [];
    // 获取用户指定的日期，如果没有则使用当前日期
    const conversationDate = getConversationDate();
    
    messages.push({
        sender: 'company',
        text: `Good morning ${customerName}. We're conducting an enhanced due diligence review per regulatory requirements. We require bank statements for the last 2-3 months to verify source of funds.`,
        time: formatTimeWithRange(day1, 9, 0)
    });

    if (willProvide) {
        const variants = [
            () => {
                messages.push({ sender: 'customer', text: `Understood. What's the preferred method of submission?`, time: formatTimeWithRange(day1, 9, 3) });
                messages.push({ sender: 'company', text: `Please submit via email to compliance@geoswift.com. Ensure all pages are included and clearly legible.`, time: formatTimeWithRange(day1, 9, 6) });
                messages.push({ sender: 'customer', text: `Understood. Are there any specific formatting requirements?`, time: formatTimeWithRange(day1, 9, 9) });
                messages.push({ sender: 'company', text: `PDF format is preferred. The statements must clearly show your name, account number, and transaction history for the specified period.`, time: formatTimeWithRange(day1, 9, 12) });
                messages.push({ sender: 'customer', text: `Noted. I'll submit them today. What is the expected timeline for review?`, time: formatTimeWithRange(day1, 9, 15) });
                messages.push({ sender: 'company', text: `Our compliance team typically completes the review within 2-3 business days. You'll receive confirmation upon receipt and notification once the review is complete.`, time: formatTimeWithRange(day1, 9, 18) });
                messages.push({ sender: 'customer', text: `Thank you for the clarification. I'll ensure everything is submitted promptly.`, time: formatTimeWithRange(day1, 9, 21) });
                messages.push({ sender: 'company', text: `We appreciate your cooperation. Should you have any questions during the process, please don't hesitate to contact us.`, time: formatTimeWithRange(day1, 9, 24) });
            },
            () => {
                messages.push({ sender: 'customer', text: `I can provide those documents. What is the submission deadline?`, time: formatTimeWithRange(day1, 9, 3) });
                messages.push({ sender: 'company', text: `We request submission within 5 business days to avoid delays in the verification process.`, time: formatTimeWithRange(day1, 9, 6) });
                messages.push({ sender: 'customer', text: `Understood. Will online banking statements be acceptable, or do they require bank stamping?`, time: formatTimeWithRange(day1, 9, 9) });
                messages.push({ sender: 'company', text: `Online banking statements are acceptable provided they display your name, account number, and transaction details clearly. Bank stamping is not required.`, time: formatTimeWithRange(day1, 9, 12) });
                messages.push({ sender: 'customer', text: `Excellent. I'll prepare and submit them via email to compliance@geoswift.com.`, time: formatTimeWithRange(day1, 9, 15) });
                messages.push({ sender: 'company', text: `Perfect. Please include your account reference number in the subject line to facilitate processing.`, time: formatTimeWithRange(day1, 9, 18) });
                messages.push({ sender: 'customer', text: `Will do. I'll submit them by end of business today.`, time: formatTimeWithRange(day1, 9, 21) });
                messages.push({ sender: 'company', text: `Thank you for your prompt response. We'll acknowledge receipt and proceed with the review.`, time: formatTimeWithRange(day1, 9, 24) });
            },
            () => {
                messages.push({ sender: 'customer', text: `I can provide the requested documentation. What format do you require?`, time: formatTimeWithRange(day1, 9, 3) });
                messages.push({ sender: 'company', text: `PDF format is preferred. Please ensure all pages are included and the documents are clearly readable.`, time: formatTimeWithRange(day1, 9, 6) });
                messages.push({ sender: 'customer', text: `Understood. Should I send statements from all accounts or only the primary account?`, time: formatTimeWithRange(day1, 9, 9) });
                messages.push({ sender: 'company', text: `We require statements from all accounts that will be used for transactions with our platform. This ensures comprehensive verification.`, time: formatTimeWithRange(day1, 9, 12) });
                messages.push({ sender: 'customer', text: `Noted. I'll compile all relevant statements and submit them together.`, time: formatTimeWithRange(day1, 9, 15) });
                messages.push({ sender: 'company', text: `That would be ideal. Please send to compliance@geoswift.com with your account reference in the subject line.`, time: formatTimeWithRange(day1, 9, 18) });
                messages.push({ sender: 'customer', text: `Understood. I'll submit them within the next 24 hours.`, time: formatTimeWithRange(day1, 9, 21) });
                messages.push({ sender: 'company', text: `Thank you. We'll confirm receipt and provide updates on the review timeline.`, time: formatTimeWithRange(day1, 9, 24) });
            },
            () => {
                messages.push({ sender: 'customer', text: `I'll provide the requested bank statements. What is the submission process?`, time: formatTimeWithRange(day1, 9, 3) });
                messages.push({ sender: 'company', text: `Please email the documents to compliance@geoswift.com. Include your account reference number in the subject line for efficient processing.`, time: formatTimeWithRange(day1, 9, 6) });
                messages.push({ sender: 'customer', text: `Understood. Will I receive confirmation of receipt?`, time: formatTimeWithRange(day1, 9, 9) });
                messages.push({ sender: 'company', text: `Yes, you'll receive an automated confirmation email upon receipt. Our compliance team will then review the documents within 2-3 business days.`, time: formatTimeWithRange(day1, 9, 12) });
                messages.push({ sender: 'customer', text: `Thank you. I'll submit the documents today.`, time: formatTimeWithRange(day1, 9, 15) });
                messages.push({ sender: 'company', text: `We appreciate your cooperation. Should we require any additional documentation, we'll contact you promptly.`, time: formatTimeWithRange(day1, 9, 18) });
                messages.push({ sender: 'customer', text: `Understood. I'll ensure everything is submitted correctly.`, time: formatTimeWithRange(day1, 9, 21) });
                messages.push({ sender: 'company', text: `Thank you. We'll be in touch once the review is complete.`, time: formatTimeWithRange(day1, 9, 24) });
            },
            () => {
                messages.push({ sender: 'customer', text: `I can provide the bank statements. What specific information must be visible on the statements?`, time: formatTimeWithRange(day1, 9, 3) });
                messages.push({ sender: 'company', text: `The statements must clearly display your full name, account number, bank name, and transaction history for the last 2-3 months. All pages must be included.`, time: formatTimeWithRange(day1, 9, 6) });
                messages.push({ sender: 'customer', text: `Understood. I'll ensure all pages are included and clearly legible.`, time: formatTimeWithRange(day1, 9, 9) });
                messages.push({ sender: 'company', text: `Perfect. Please submit via email to compliance@geoswift.com.`, time: formatTimeWithRange(day1, 9, 12) });
                messages.push({ sender: 'customer', text: `Will do. What is the expected processing time?`, time: formatTimeWithRange(day1, 9, 15) });
                messages.push({ sender: 'company', text: `Review typically takes 2-3 business days. You'll receive updates at each stage of the process.`, time: formatTimeWithRange(day1, 9, 18) });
                messages.push({ sender: 'customer', text: `Thank you for the information. I'll submit the documents promptly.`, time: formatTimeWithRange(day1, 9, 21) });
                messages.push({ sender: 'company', text: `We appreciate your cooperation with this regulatory requirement.`, time: formatTimeWithRange(day1, 9, 24) });
            }
        ];
        const selectedVariant = variants[variant % variants.length];
        selectedVariant();
    } else {
        const refusalReason = generateRefusalReason(customerName);
        messages.push({
            sender: 'customer',
            text: refusalReason.text,
            time: formatTimeWithRange(conversationDate, 9, 3)
        });

        messages.push({
            sender: 'company',
            text: `I understand your concerns. This is a mandatory regulatory requirement for enhanced due diligence. All documentation is handled in strict confidence and stored securely per data protection regulations.`,
            time: formatTimeWithRange(conversationDate, 9, 7)
        });

        messages.push({
            sender: 'customer',
            text: `I need to understand the legal basis for this requirement. Can you provide the specific regulation?`,
            time: formatTimeWithRange(conversationDate, 9, 11)
        });

        messages.push({
            sender: 'company',
            text: `This falls under AML/KYC regulations requiring enhanced due diligence for certain risk profiles. I can provide you with the relevant regulatory references. However, this documentation remains mandatory for account verification.`,
            time: formatTimeWithRange(conversationDate, 9, 15)
        });

        messages.push({
            sender: 'customer',
            text: `I'll need to review the regulatory basis before proceeding. I'll get back to you.`,
            time: formatTimeWithRange(conversationDate, 9, 19)
        });

        messages.push({
            sender: 'company',
            text: `Understood. I'll forward the relevant documentation. Please review and confirm your decision at your earliest convenience.`,
            time: formatTimeWithRange(conversationDate, 9, 22)
        });
    }

    return messages;
}

// ========== 合规问题答案生成函数 ==========

// 生成合规问题答案
function generateComplianceAnswers(customerName, purposeDetails, scene) {
    const style = getConversationStyle(customerName);
    const variant = getConversationVariant(customerName);
    const seed = getRandomSeed(customerName);
    
    // 获取交易目的信息
    let purposes = [];
    if (purposeDetails && Array.isArray(purposeDetails)) {
        purposes = purposeDetails.map(p => p.main);
    } else if (scene === 'kyc') {
        // KYC场景，使用默认目的
        purposes = ['investment'];
    }
    
    // 生成三个答案
    const sourceOfFunds = generateSourceOfFunds(customerName, purposes, style, variant, seed);
    const fundFlow = generateFundFlow(customerName, purposes, style, variant, seed);
    const transactionPurpose = generateTransactionPurpose(customerName, purposes, style, variant, seed);
    
    // 显示答案
    document.getElementById('sourceOfFunds').value = sourceOfFunds;
    document.getElementById('fundFlow').value = fundFlow;
    document.getElementById('transactionPurpose').value = transactionPurpose;
    document.getElementById('complianceAnswersSection').style.display = 'block';
}

// 生成资金来源详细说明
function generateSourceOfFunds(customerName, purposes, style, variant, seed) {
    const styleMap = {
        verbose: generateVerboseSourceOfFunds,
        concise: generateConciseSourceOfFunds,
        cautious: generateCautiousSourceOfFunds,
        urgent: generateUrgentSourceOfFunds,
        friendly: generateFriendlySourceOfFunds,
        professional: generateProfessionalSourceOfFunds,
        detailed: generateVerboseSourceOfFunds,
        casual: generateFriendlySourceOfFunds,
        formal: generateProfessionalSourceOfFunds,
        inquisitive: generateVerboseSourceOfFunds,
        straightforward: generateConciseSourceOfFunds,
        elaborate: generateVerboseSourceOfFunds
    };
    
    const generator = styleMap[style] || generateFriendlySourceOfFunds;
    return generator(customerName, purposes, variant, seed);
}

// 生成资金流向说明
function generateFundFlow(customerName, purposes, style, variant, seed) {
    const styleMap = {
        verbose: generateVerboseFundFlow,
        concise: generateConciseFundFlow,
        cautious: generateCautiousFundFlow,
        urgent: generateUrgentFundFlow,
        friendly: generateFriendlyFundFlow,
        professional: generateProfessionalFundFlow,
        detailed: generateVerboseFundFlow,
        casual: generateFriendlyFundFlow,
        formal: generateProfessionalFundFlow,
        inquisitive: generateVerboseFundFlow,
        straightforward: generateConciseFundFlow,
        elaborate: generateVerboseFundFlow
    };
    
    const generator = styleMap[style] || generateFriendlyFundFlow;
    return generator(customerName, purposes, variant, seed);
}

// 生成交易目的详细说明
function generateTransactionPurpose(customerName, purposes, style, variant, seed) {
    const styleMap = {
        verbose: generateVerboseTransactionPurpose,
        concise: generateConciseTransactionPurpose,
        cautious: generateCautiousTransactionPurpose,
        urgent: generateUrgentTransactionPurpose,
        friendly: generateFriendlyTransactionPurpose,
        professional: generateProfessionalTransactionPurpose,
        detailed: generateVerboseTransactionPurpose,
        casual: generateFriendlyTransactionPurpose,
        formal: generateProfessionalTransactionPurpose,
        inquisitive: generateVerboseTransactionPurpose,
        straightforward: generateConciseTransactionPurpose,
        elaborate: generateVerboseTransactionPurpose
    };
    
    const generator = styleMap[style] || generateFriendlyTransactionPurpose;
    return generator(customerName, purposes, variant, seed);
}

// ========== 资金来源详细说明生成函数（不同风格） ==========

// 话多型资金来源说明
function generateVerboseSourceOfFunds(customerName, purposes, variant, seed) {
    const variants = [
        `The funds originate from my personal savings accumulated through employment. I receive regular salary payments and quarterly bonuses. I have also made some investments in the stock market which have contributed to my savings. All funds are held in my personal bank accounts and I can provide bank statements for verification.`,
        `My source of funds comes from multiple sources: (1) Salary income from my employment; (2) Investment returns from a diversified portfolio; (3) Rental income from a property I own; and (4) Occasional freelance consulting work. All income streams are documented and can be verified through tax returns, pay stubs, and bank statements.`,
        `The funds are derived from my savings and investment portfolio. I have been saving a portion of my income from employment. My primary sources include regular salary payments, annual bonuses, dividends from investments, and interest earned on savings accounts. I can provide documentation including tax forms and bank statements.`
    ];
    return seededChoice(variants, seed, variant);
}

// 简洁型资金来源说明
function generateConciseSourceOfFunds(customerName, purposes, variant, seed) {
    const variants = [
        `Salary income from employment. Bank statements available.`,
        `Personal savings from employment income.`,
        `Employment income and investment returns.`
    ];
    return seededChoice(variants, seed, variant);
}

// 谨慎型资金来源说明
function generateCautiousSourceOfFunds(customerName, purposes, variant, seed) {
    const variants = [
        `The funds originate from my verified employment income. I can provide employment verification letters, pay stubs, and bank statements showing regular salary deposits. All funds are held in accounts under my name and I maintain complete records of all transactions.`,
        `My source of funds consists of legitimate income from my professional employment. I can provide documentation including employment contract, pay stubs, tax returns, and bank statements. All accounts are in my name and I am committed to providing all necessary verification documents.`
    ];
    return seededChoice(variants, seed, variant);
}

// 急切型资金来源说明
function generateUrgentSourceOfFunds(customerName, purposes, variant, seed) {
    const variants = [
        `Employment income. Bank statements available.`,
        `Salary from employment. Can provide pay stubs and bank statements.`,
        `Personal savings from employment income.`
    ];
    return seededChoice(variants, seed, variant);
}

// 友好型资金来源说明
function generateFriendlySourceOfFunds(customerName, purposes, variant, seed) {
    const variants = [
        `Hi! The funds come from my regular salary. I've been saving up for a while, and all the money is in my personal bank account. I'm happy to provide bank statements or pay stubs if you need them!`,
        `Sure! The money comes from my job income. I've been putting aside some savings each month. Everything is documented and I can share statements whenever you need them. Thanks!`
    ];
    return seededChoice(variants, seed, variant);
}

// 专业型资金来源说明
function generateProfessionalSourceOfFunds(customerName, purposes, variant, seed) {
    const variants = [
        `The funds originate from verified employment income. I receive regular salary payments. Funds are held in my personal bank account. I can provide employment verification, pay stubs, and bank statements upon request.`,
        `Source of funds: Employment income. Funds are maintained in personal bank accounts and can be verified through employment letters, tax returns, and bank statements.`
    ];
    return seededChoice(variants, seed, variant);
}

// ========== 资金流向说明生成函数（不同风格） ==========

// 话多型资金流向说明
function generateVerboseFundFlow(customerName, purposes, variant, seed) {
    const variants = [
        `The funds will flow from my personal bank account to your platform via wire transfer. Once received, I intend to convert them to USDT for my investment purposes. I can provide bank transfer confirmations for your records.`,
        `Here's how the funds will move: I'll transfer the amount from my savings account to my checking account, then initiate a bank transfer to your platform. After the funds are deposited into my platform account, I plan to use them to purchase USDT tokens. I can provide transaction confirmations at each step.`,
        `The fund flow process: (1) Funds from my savings account; (2) Transfer to checking account; (3) Wire transfer to your platform's bank account; (4) Funds credited to my platform account; (5) Conversion to USDT. I can provide documentation for each step.`
    ];
    return seededChoice(variants, seed, variant);
}

// 简洁型资金流向说明
function generateConciseFundFlow(customerName, purposes, variant, seed) {
    const variants = [
        `Bank account → Platform → USDT conversion`,
        `Personal account → Wire transfer → Platform → USDT`,
        `Savings account → Transfer → Platform → Purchase USDT`
    ];
    return seededChoice(variants, seed, variant);
}

// 谨慎型资金流向说明
function generateCautiousFundFlow(customerName, purposes, variant, seed) {
    const variants = [
        `The funds will flow from my personal bank account via wire transfer to your platform's bank account. Upon receipt, the funds will be credited to my account on your platform. I will maintain records of all transactions and can provide transfer confirmations and bank statements.`,
        `Fund flow path: Personal bank account → Wire transfer to platform's bank account → Credit to my platform account → Conversion to USDT. All transactions will be documented and traceable. I am prepared to provide complete documentation for compliance review.`
    ];
    return seededChoice(variants, seed, variant);
}

// 急切型资金流向说明
function generateUrgentFundFlow(customerName, purposes, variant, seed) {
    const variants = [
        `Bank → Platform → USDT. Transfer ready to execute.`,
        `Wire transfer from my account to platform. Then convert to USDT.`,
        `Bank transfer → Platform account → USDT purchase. All set.`
    ];
    return seededChoice(variants, seed, variant);
}

// 友好型资金流向说明
function generateFriendlyFundFlow(customerName, purposes, variant, seed) {
    const variants = [
        `The money will come from my bank account - I'll do a wire transfer to your platform, then convert it to USDT for my investments. I can show you the transfer confirmation once it's done.`,
        `Here's the flow: My savings account → Wire transfer to your platform → Then I'll buy USDT with those funds. Happy to provide any documentation you need!`
    ];
    return seededChoice(variants, seed, variant);
}

// 专业型资金流向说明
function generateProfessionalFundFlow(customerName, purposes, variant, seed) {
    const variants = [
        `Fund Flow: (1) Personal bank account; (2) Wire transfer; (3) Platform's bank account; (4) Platform credit; (5) Conversion to USDT. All steps documented.`,
        `Flow Path:
- Source: Personal bank account
- Transfer: Wire Transfer
- Destination: Platform's bank account
- Credit: Platform account
- Final: Conversion to USDT`
    ];
    return seededChoice(variants, seed, variant);
}

// ========== 交易目的详细说明生成函数（不同风格） ==========

// 话多型交易目的说明
function generateVerboseTransactionPurpose(customerName, purposes, variant, seed) {
    const purposeText = purposes.length > 0 ? purposes.join(', ') : 'investment';
    const variants = [
        `My primary purpose for these transactions is ${purposeText}. I am looking to diversify my investment portfolio by including cryptocurrency assets. I have been researching the crypto market and believe that USDT provides a stable entry point. I plan to use these funds to make strategic investments over time.`,
        `The purpose of these transactions is ${purposeText}. I have been investing in various financial instruments including stocks and mutual funds. Now, I want to add cryptocurrency to my investment mix, starting with USDT due to its stability.`,
        `I intend to use these funds for ${purposeText} purposes. I am interested in entering the cryptocurrency market as part of my investment diversification strategy. USDT appeals to me because it maintains a stable value, making it a good starting point for crypto investing.`
    ];
    return seededChoice(variants, seed, variant);
}

// 简洁型交易目的说明
function generateConciseTransactionPurpose(customerName, purposes, variant, seed) {
    const purposeText = purposes.length > 0 ? purposes.join(', ') : 'investment';
    const variants = [
        `Purpose: ${purposeText}. Diversifying portfolio with cryptocurrency.`,
        `Transaction purpose: ${purposeText}. Building crypto portfolio.`,
        `Purpose: ${purposeText}. Adding cryptocurrency to investment strategy.`
    ];
    return seededChoice(variants, seed, variant);
}

// 谨慎型交易目的说明
function generateCautiousTransactionPurpose(customerName, purposes, variant, seed) {
    const purposeText = purposes.length > 0 ? purposes.join(', ') : 'investment';
    const variants = [
        `The purpose of these transactions is ${purposeText}. I am engaging in these transactions as part of a carefully considered investment strategy. I have conducted research on cryptocurrency markets, understand the risks, and have determined that this aligns with my investment objectives.`,
        `Transaction Purpose: ${purposeText}. I am pursuing these transactions for legitimate investment purposes as part of my diversified portfolio strategy. I have evaluated the risks and benefits and determined that cryptocurrency investments fit within my financial planning goals.`
    ];
    return seededChoice(variants, seed, variant);
}

// 急切型交易目的说明
function generateUrgentTransactionPurpose(customerName, purposes, variant, seed) {
    const purposeText = purposes.length > 0 ? purposes.join(', ') : 'investment';
    const variants = [
        `Purpose: ${purposeText}.`,
        `Transaction purpose: ${purposeText}.`,
        `Purpose: ${purposeText}.`
    ];
    return seededChoice(variants, seed, variant);
}

// 友好型交易目的说明
function generateFriendlyTransactionPurpose(customerName, purposes, variant, seed) {
    const purposeText = purposes.length > 0 ? purposes.join(', ') : 'investment';
    const variants = [
        `Hi! I'm looking to use these funds for ${purposeText}. I've been wanting to get into cryptocurrency, and USDT seems like a good place to start since it's stable. Happy to answer any questions!`,
        `Sure! The purpose is ${purposeText}. I'm interested in diversifying my investments and thought crypto would be a good addition. USDT looks like a stable option to begin with.`
    ];
    return seededChoice(variants, seed, variant);
}

// 专业型交易目的说明
function generateProfessionalTransactionPurpose(customerName, purposes, variant, seed) {
    const purposeText = purposes.length > 0 ? purposes.join(', ') : 'investment';
    const variants = [
        `Transaction Purpose: ${purposeText}. Objective: Portfolio diversification through cryptocurrency assets. Strategy: Initial allocation to USDT as foundation, with potential expansion to other cryptocurrencies.`,
        `Purpose: ${purposeText}
Objective: Diversify portfolio
Strategy: 
1. Initial investment in USDT
2. Potential expansion to other cryptocurrencies
3. Long-term wealth building`
    ];
    return seededChoice(variants, seed, variant);
}


// ========== AI 优化对话功能（支持多个免费AI API） ==========

// 使用 AI API 优化对话，使其更自然、更像真人
async function optimizeConversationWithAI(conversation, customerName, platform, provider, apiKey) {
    if (!conversation || conversation.length === 0) {
        return conversation;
    }

    try {
        // 构建提示词
        const platformContext = platform === 'whatsapp' ? 'WhatsApp' : 
                               platform === 'telegram' ? 'Telegram' : 
                               'Email';
        
        const conversationText = conversation.map(msg => {
            const sender = msg.sender === 'customer' ? 'Customer' : 'Company';
            return `${sender}: ${msg.text}`;
        }).join('\n');

        // 获取用户自定义的 prompt，如果没有则使用默认 prompt
        let customPrompt = getCustomAIPrompt();
        const promptMode = getPromptMode(); // 'append' 或 'replace'
        
        const defaultPrompt = `You are a conversation optimization expert. Please refine the following ${platformContext} conversation to make it more natural and human-like, while keeping it in English.

IMPORTANT REQUIREMENTS:
1. Keep the conversation in English - DO NOT translate to Chinese or any other language
2. Maintain the core information and purpose of the conversation
3. Make the language more natural, conversational, and human-like
4. Add appropriate conversational elements like natural pauses, casual expressions, and authentic phrasing
5. Keep the original conversation style (friendly, professional, etc.)
6. Do not change the basic structure and order of the conversation
7. Keep the customer name: ${customerName}
8. Make it sound like real people talking, not robotic or template-like

Original conversation:
${conversationText}

Please return the optimized conversation as a JSON array, where each element contains:
- sender: "customer" or "company"
- text: the refined message content (in English, more natural and human-like)
- time: keep the original time (format: HH:mm)

Return ONLY the JSON array, no other content.`;

        // 如果用户提供了自定义 prompt，根据模式处理
        let prompt;
        if (customPrompt && promptMode === 'replace') {
            // 替换模式：完全替换默认 prompt
            prompt = customPrompt
                .replace(/\{platformContext\}/g, platformContext)
                .replace(/\{customerName\}/g, customerName)
                .replace(/\{conversationText\}/g, conversationText);
        } else if (customPrompt && promptMode === 'append') {
            // 追加模式：在默认 prompt 基础上添加要求
            prompt = defaultPrompt + '\n\nADDITIONAL REQUIREMENTS:\n' + customPrompt;
        } else {
            // 没有自定义 prompt，使用默认
            prompt = defaultPrompt;
        }

        let optimizedConversation;
        
        // 根据提供商调用不同的API
        switch (provider) {
            case 'gemini':
                optimizedConversation = await callGeminiAPI(prompt, apiKey);
                break;
            case 'groq':
                optimizedConversation = await callGroqAPI(prompt, apiKey);
                break;
            case 'huggingface':
                optimizedConversation = await callHuggingFaceAPI(prompt, apiKey);
                break;
            case 'openai':
                optimizedConversation = await callOpenAIAPI(prompt, apiKey);
                break;
            default:
                throw new Error('不支持的AI提供商');
        }

        // 验证并合并时间信息
        if (Array.isArray(optimizedConversation) && optimizedConversation.length === conversation.length) {
            return optimizedConversation.map((msg, index) => ({
                sender: msg.sender || conversation[index].sender,
                text: msg.text || conversation[index].text,
                time: conversation[index].time // 保持原有时间
            }));
        } else {
            console.warn('AI返回的对话长度不匹配，使用原始对话');
            return conversation;
        }
    } catch (error) {
        console.error('AI优化对话时出错:', error);
        throw error;
    }
}

// Google Gemini API（免费，推荐）
async function callGeminiAPI(prompt, apiKey) {
    // 根据实际的模型列表，使用支持的模型
    // 从 https://generativelanguage.googleapis.com/v1beta/models 可以看到支持的模型
    // 推荐使用 gemini-2.5-flash（免费且快速）或 gemini-2.5-pro（更强能力）
    
    const apiConfigs = [
        {
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            model: 'gemini-2.5-flash'
        },
        {
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
            model: 'gemini-2.5-pro'
        },
        {
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            model: 'gemini-2.0-flash'
        },
        {
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`,
            model: 'gemini-2.0-flash-001'
        }
    ];
    
    let lastError = null;
    
    for (const config of apiConfigs) {
        try {
            const response = await fetch(config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                lastError = new Error(`Gemini API请求失败 (${config.model}): ${response.status} - ${errorData.error?.message || response.statusText}`);
                // 如果这个模型不可用，尝试下一个
                if (response.status === 404 && apiConfigs.indexOf(config) < apiConfigs.length - 1) {
                    continue;
                }
                throw lastError;
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
                throw new Error('Gemini API 返回格式不正确');
            }
            const optimizedText = data.candidates[0].content.parts[0].text.trim();
            
            return parseAIResponse(optimizedText);
        } catch (error) {
            // 如果是最后一个配置，抛出错误
            if (apiConfigs.indexOf(config) === apiConfigs.length - 1) {
                throw error;
            }
            // 否则继续尝试下一个配置
            lastError = error;
        }
    }
    
    // 如果所有配置都失败，抛出最后一个错误
    throw lastError || new Error('所有 Gemini API 配置都不可用，请检查您的 API Key 是否正确');
}

// Groq API（免费，快速）
async function callGroqAPI(prompt, apiKey) {
    // Groq 当前支持的模型列表（根据 https://console.groq.com/docs/deprecations）
    // llama-3.1-70b-versatile 已停用，不再使用
    // 优先使用 llama-3.3-70b-versatile（最新版本），如果不可用则尝试其他模型
    const models = [
        'llama-3.3-70b-versatile',  // 最新版本，推荐（Llama 3.3 70B）
        'llama-3.1-8b-instant',     // 快速版本（Llama 3.1 8B）
        'mixtral-8x7b-32768',       // Mixtral 8x7B 模型（32K 上下文）
        'gemma2-9b-it'              // Gemma 2 9B 模型
    ];
    
    let lastError = null;
    
    for (const model of models) {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional conversation optimization assistant. Your task is to refine English conversations to make them more natural and human-like, while keeping them in English. DO NOT translate to Chinese or any other language.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || response.statusText;
                
                // 如果模型已停用或不可用，尝试下一个模型
                if (response.status === 400 && (errorMessage.includes('decommissioned') || errorMessage.includes('not found'))) {
                    lastError = new Error(`Groq API请求失败 (${model}): ${response.status} - ${errorMessage}`);
                    if (models.indexOf(model) < models.length - 1) {
                        continue; // 尝试下一个模型
                    }
                }
                
                throw new Error(`Groq API请求失败 (${model}): ${response.status} - ${errorMessage}`);
            }

            const data = await response.json();
            const optimizedText = data.choices[0].message.content.trim();
            
            return parseAIResponse(optimizedText);
        } catch (error) {
            // 如果是最后一个模型，抛出错误
            if (models.indexOf(model) === models.length - 1) {
                throw error;
            }
            // 否则继续尝试下一个模型
            lastError = error;
        }
    }
    
    // 如果所有模型都失败，抛出最后一个错误
    throw lastError || new Error('所有 Groq 模型都不可用，请检查您的 API Key 是否正确');
}

// Hugging Face API（免费）
async function callHuggingFaceAPI(prompt, apiKey) {
    const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                max_new_tokens: 2000,
                temperature: 0.7
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Hugging Face API请求失败: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const optimizedText = Array.isArray(data) ? data[0].generated_text : data.generated_text;
    
    return parseAIResponse(optimizedText);
}

// OpenAI API（付费）
async function callOpenAIAPI(prompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional conversation optimization assistant. Your task is to refine English conversations to make them more natural and human-like, while keeping them in English. DO NOT translate to Chinese or any other language.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const optimizedText = data.choices[0].message.content.trim();
    
    return parseAIResponse(optimizedText);
}

// 解析AI返回的内容
function parseAIResponse(text) {
    try {
        // 尝试直接解析
        return JSON.parse(text);
    } catch (e) {
        // 如果直接解析失败，尝试提取JSON部分
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('无法解析AI返回的内容');
        }
    }
}

// 检查是否启用AI优化
function shouldUseAIOptimization() {
    const checkbox = document.getElementById('useAIOptimization');
    return checkbox && checkbox.checked;
}

// 获取AI提供商
function getAIProvider() {
    const select = document.getElementById('aiProvider');
    return select ? select.value : 'gemini';
}

// 获取AI API Key
function getAIApiKey() {
    const input = document.getElementById('aiApiKey');
    if (!input) return '';
    // 优先使用存储的完整 key，如果没有则使用当前值
    const fullKey = input.dataset.fullKey;
    const currentValue = input.value.trim();
    // 如果当前值是隐藏格式（包含 ***），使用完整 key
    if (fullKey && currentValue.includes('***')) {
        return fullKey;
    }
    // 否则使用当前值（可能是用户手动输入的）
    return currentValue || fullKey || '';
}

// 获取自定义 AI Prompt
function getCustomAIPrompt() {
    const textarea = document.getElementById('customAIPrompt');
    if (!textarea) return null;
    const customPrompt = textarea.value.trim();
    return customPrompt || null;
}

// 获取 Prompt 模式（append 或 replace）
function getPromptMode() {
    const replaceRadio = document.querySelector('input[name="promptMode"][value="replace"]');
    if (replaceRadio && replaceRadio.checked) {
        return 'replace';
    }
    return 'append'; // 默认是追加模式
}
