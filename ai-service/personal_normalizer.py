import re

# Từ điển tự động sửa lỗi gõ phím nhanh tiếng Việt (Telex errors & viết tắt thường gặp trong ghi chú cá nhân)
TYPO_CORRECTIONS = {
    r'\bmau\s+đồ\s+ăn\b': 'mua đồ ăn',
    r'\bmau\b': 'mua',
    r'\bddepjd\s+dẽ\b': 'đẹp đẽ',
    r'\bddepj\b': 'đẹp',
    r'\bl33n\b': 'lên',
    r'\bko\b': 'không',
    r'\bdc\b': 'được',
    r'\bđk\b': 'được',
    r'\bvs\b': 'với',
    r'\bng\b': 'người',
    r'\bcv\b': 'công việc',
    r'\bhnay\b': 'hôm nay',
    r'\bsmai\b': 'sáng mai',
    r'\btmai\b': 'tối mai',
    r'\bbcao\b': 'báo cáo',
    r'\btrc\b': 'trước',
    r'\bsk\b': 'sức khỏe',
    r'\blquan\b': 'liên quan',
    r'\bnhé\b': '',
    r'\bnhơ\b': 'nhớ'
}

ROLES = [
    r'người\s+ghi\s+chú',
    r'người\s+phụ\s+trách',
    r'thư\s+ký',
    r'trưởng\s+nhóm',
    r'trợ\s+lý',
    r'leader',
    r'pm',
    r'dev',
    r'tester',
    r'designer',
    r'mình',
    r'tôi',
    r'chúng\s+mình',
    r'em',
    r'ta'
]
ROLE_REGEX = '|'.join(ROLES)

ACTION_VERBS = [
    'chuẩn bị', 'kiểm tra', 'gửi', 'nộp', 'làm', 'sửa', 'mua', 'viết', 'gọi', 
    'dọn', 'liên hệ', 'phụ trách', 'hoàn thành', 'đặt lịch', 'trao đổi', 'khảo sát', 'ôn tập',
    'chạy', 'học', 'báo cáo', 'thiết kế', 'demo', 'cài đặt', 'xem lại', 'ghi lại',
    'ghi chép', 'ghi', 'tổng hợp', 'soạn', 'soạn thảo', 'phân tích', 'cập nhật', 'theo dõi', 'chốt',
    'thống kê', 'duyệt', 'thực hiện', 'hỗ trợ', 'nhắc nhở', 'sắp xếp', 'thông báo', 'bàn giao'
]
VERB_PATTERN = '|'.join(sorted(ACTION_VERBS, key=len, reverse=True))

NAME_PAT = r'(?:(?:anh|chị|em|bạn|ông|bà)\s+)?[A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){0,2}'

CONTEXT_PATTERNS = [
    r'\bdự\s+kiến\s+(diễn\s+ra|bắt\s+đầu)\b',
    r'\bdiễn\s+ra\s+vào\b',
    r'\btổ\s+chức\s+vào\b',
    r'\bthời\s+gian\s+(dự\s+kiến|là)\b',
    r'\bđịa\s+điểm\s+tại\b',
    r'\bthông\s+báo\s+rằng\b',
    r'\blịch\s+họp\b'
]

def clean_typos(text: str) -> str:
    """Tự động sửa các lỗi gõ phím vội khi ghi chép cá nhân"""
    cleaned = text
    for pat, rep in TYPO_CORRECTIONS.items():
        cleaned = re.sub(pat, rep, cleaned, flags=re.IGNORECASE)
    return re.sub(r'\s+', ' ', cleaned).strip()

def has_action_verb(text: str) -> bool:
    """Kiểm tra câu hoặc vế có chứa động từ hành động thực sự không"""
    t = text.lower()
    return any(re.search(r'\b' + v + r'\b', t) for v in ACTION_VERBS)

def is_context_text(text: str) -> bool:
    """Kiểm tra câu hoặc vế có phải là thông tin bối cảnh/mô tả không phải nhiệm vụ"""
    t = text.lower()
    if any(re.search(pat, t) for pat in CONTEXT_PATTERNS):
        return True
    if ('cuộc họp' in t or 'họp' in t) and ('thứ' in t or 'tuần' in t or 'ngày' in t or 'giờ' in t or 'lúc' in t):
        return True
    return False

def extract_task_from_clause(cl: str):
    """
    Trích xuất nhiệm vụ và người phụ trách (nếu có) từ một vế câu:
    - Trả về 'Minh: Chuẩn bị tài liệu'
    - Trả về 'Người Ghi Chú: Ghi lại biên bản cuộc họp'
    - Trả về 'Mua bánh mì' (nếu không có người phụ trách)
    - Trả về None nếu không phải là nhiệm vụ hành động
    """
    c = cl.strip(' ,.;-')
    if not c:
        return None

    # 1. Khớp theo vai trò được gán (người ghi chú, thư ký, mình, leader...)
    m_role = re.match(rf'^({ROLE_REGEX})\s+((?:{VERB_PATTERN})\b.+)$', c, flags=re.IGNORECASE)
    if m_role:
        who = m_role.group(1).strip()
        action = m_role.group(2).strip()
        who_disp = ' '.join(w.capitalize() for w in who.split())
        action_disp = action[0].upper() + action[1:]
        return f"{who_disp}: {action_disp}"

    # 2. Khớp theo tên riêng viết hoa (Minh, Lan, Anh Tuấn, Lê Văn Minh...)
    m_name = re.match(rf'^({NAME_PAT})\s+((?:{VERB_PATTERN})\b.+)$', c)
    if m_name:
        who = m_name.group(1).strip()
        action = m_name.group(2).strip()
        who_disp = ' '.join(w.capitalize() for w in who.split())
        action_disp = action[0].upper() + action[1:]
        return f"{who_disp}: {action_disp}"

    # 3. Nhiệm vụ hành động không có người cụ thể
    if has_action_verb(c):
        return c[0].upper() + c[1:]

    return None

def parse_personal_note(raw_text: str) -> dict:
    """
    Phân tích ghi chú chuẩn chỉnh:
    - Bug 01: Không tách sai các cụm từ như 'tiếp theo', giữ câu mô tả hoàn chỉnh.
    - Bug 02: Phân biệt rõ thông tin mô tả chung (không gắn checkbox) vs nhiệm vụ thực sự (gắn checkbox [ ]).
    - Bug 03: Tách riêng từng nhiệm vụ và gán đúng người phụ trách (Minh, Lan, Người ghi chú, Mình...).
    """
    cleaned = clean_typos(raw_text.strip())
    
    # 1. Tách văn bản thành các câu chính theo dấu chấm, chấm than, chấm hỏi, xuống dòng
    sentences = [s.strip() for s in re.split(r'(?<=[.!?\n])\s+', cleaned) if s.strip()]
    if not sentences:
        sentences = [cleaned]

    context_paragraphs = []
    task_items = []

    for s in sentences:
        s_clean = s.strip(' ,.;-')
        if not s_clean:
            continue

        # Nếu cả câu là bối cảnh (mô tả thời gian, lịch họp, địa điểm...) và không chứa phân công nhiệm vụ
        if is_context_text(s_clean) and not re.search(r'(?i)\b(chuẩn\s+bị|nộp|kiểm\s+tra|gửi|làm|báo\s+cáo|phân\s+công|tổng\s+hợp)\b', s_clean):
            full_s = s_clean if s_clean.endswith(('.', '!', '?')) else s_clean + '.'
            context_paragraphs.append(full_s)
            continue

        # Tách vế bằng dấu phẩy, chấm phẩy, hoặc từ nối công việc
        clauses = re.split(r'[,;]|\s+(?:và|còn|rồi|sau\s+đó|tiếp\s+theo\s+đó)\s+', s_clean)
        
        has_found_task = False
        for cl in clauses:
            cl = cl.strip(' ,.;-')
            if not cl:
                continue

            task = extract_task_from_clause(cl)
            if task:
                task_items.append(task)
                has_found_task = True
            elif is_context_text(cl) or (len(cl) > 10 and not has_action_verb(cl)):
                # Nếu vế là bối cảnh hoặc mô tả chung không phải hành động
                full_c = cl if cl.endswith(('.', '!', '?')) else cl + '.'
                if full_c not in context_paragraphs:
                    context_paragraphs.append(full_c)

        # Nếu cả câu không trích xuất được nhiệm vụ nào -> giữ làm câu mô tả
        if not has_found_task and not is_context_text(s_clean):
            full_s = s_clean if s_clean.endswith(('.', '!', '?')) else s_clean + '.'
            if full_s not in context_paragraphs:
                context_paragraphs.append(full_s)

    # 2. Xây dựng nội dung Markdown hoàn chỉnh:
    # Đoạn thông tin bối cảnh ở trên (không checkbox), checklist nhiệm vụ ở dưới
    result_lines = []
    if context_paragraphs:
        result_lines.append("\n".join(context_paragraphs))
        
    if task_items:
        if context_paragraphs:
            result_lines.append("") # Dòng trống phân cách
        for t in task_items:
            result_lines.append(f"- [ ] {t}")

    formatted_content = "\n".join(result_lines) if result_lines else cleaned

    # 3. Tạo tiêu đề chuẩn cho sổ tay
    title = "Danh sách việc cần làm"
    lower_text = cleaned.lower()
    if "cuộc họp" in lower_text or "họp" in lower_text:
        m_thu = re.search(r'thứ\s+(?:hai|ba|tư|bốn|năm|sáu|bảy|[2-7])|chủ\s+nhật', lower_text)
        if m_thu:
            thu_str = " ".join(w.capitalize() for w in m_thu.group(0).split())
            title = f"Cuộc họp {thu_str}"
        else:
            title = "Kế hoạch cuộc họp"
    elif "ngày mai" in lower_text or "sáng mai" in lower_text:
        title = "Việc cần làm ngày mai"
    elif "hôm nay" in lower_text or "chiều nay" in lower_text or "tối nay" in lower_text:
        title = "Việc cần xử lý hôm nay"
    elif "cuối tuần" in lower_text or "chủ nhật" in lower_text:
        title = "Kế hoạch cuối tuần"
    elif task_items:
        first_task = re.sub(r'^(chủ\s+nhật|thứ\s+[2-7]|hôm\s+nay|ngày\s+mai)\s+', '', task_items[0], flags=re.IGNORECASE).strip()
        words = first_task.split()
        if len(words) >= 3:
            title = " ".join(words[:6])
            title = title[0].upper() + title[1:]

    # 4. Nhận diện Tag
    work_keywords = ["báo cáo", "sếp", "công ty", "họp", "dự án", "khách hàng", "lỗi", "server", "giao hàng", "marketing", "tài liệu", "số liệu", "minh", "lan", "ghi chú", "thư ký"]
    study_keywords = ["bài học", "bài tập", "ôn thi", "ôn tập", "từ vựng", "khóa học", "sách", "thi", "môn", "cấu trúc dữ liệu", "tiếng anh"]
    idea_keywords = ["ý tưởng", "kinh doanh", "thử nghiệm", "sản phẩm mới", "chiến lược", "kênh tiktok", "kênh youtube"]

    work_score = sum(1 for k in work_keywords if k in lower_text)
    study_score = sum(1 for k in study_keywords if k in lower_text)
    idea_score = sum(1 for k in idea_keywords if k in lower_text)

    tag = "#Cá nhân"
    color = "#fef08a" # Vàng kem

    if idea_score > 0 and idea_score >= work_score and idea_score >= study_score:
        tag = "#Ý tưởng"
        color = "#fed7aa" # Cam đào
    elif study_score > 0 and study_score >= work_score:
        tag = "#Học tập"
        color = "#bbf7d0" # Xanh mint
    elif work_score > 0:
        tag = "#Công việc"
        color = "#bae6fd" # Xanh da trời

    return {
        "title": title,
        "tag": tag,
        "color": color,
        "context": context_paragraphs,
        "tasks": task_items,
        "formatted_content": formatted_content
    }
