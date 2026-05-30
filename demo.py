"""
WearAware – Interactive Backend Demo
Runs entirely in-memory (no live Supabase needed).
Shows the full algorithm, wardrobe, matching and analytics.
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import date, timedelta, datetime
import random

# ─── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="WearAware",
    page_icon="👗",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Colour palette ───────────────────────────────────────────────────────────
GREEN      = "#2E7D52"
LIGHT_GREEN= "#4CAF82"
AMBER      = "#F59E0B"
RED        = "#EF4444"
NAVY       = "#1E293B"
CARD_BG    = "#F8FAFC"

# ─── Fast-fashion brand list (mirrors the TypeScript service) ─────────────────
FAST_FASHION_BRANDS = {
    "shein","zara","h&m","hm","h & m","primark","penneys",
    "forever 21","forever21","boohoo","prettylittlething",
    "pretty little thing","missguided","fashion nova","romwe","zaful",
    "asos","topshop","new look","river island","charlotte russe",
    "nasty gal","select fashion","peacocks","matalan","george","f21",
    "terranova","stradivarius","bershka","pull&bear","pull & bear",
    "mango","uniqlo","gap","old navy","banana republic","express",
    "wet seal","rue21","cider","lc waikiki","koton",
}

def is_fast_fashion(brand: str) -> bool:
    if not brand:
        return False
    b = brand.strip().lower()
    for ff in FAST_FASHION_BRANDS:
        if b == ff or b in ff or ff in b:
            return True
    return False

# ─── Scoring constants ────────────────────────────────────────────────────────
WARDROBE_SIZE_THRESHOLD = 100
SIMILARITY_THRESHOLD    = 5
LOW_WEAR_THRESHOLD      = 2
NEW_ITEM_GRACE_DAYS     = 60
HIGH_WEAR_THRESHOLD     = 10
HIGH_WEAR_BONUS_CAP     = 10

def score_to_grade(score: float) -> str:
    if score >= 85: return "A+"
    if score >= 75: return "A"
    if score >= 65: return "B+"
    if score >= 55: return "B"
    if score >= 45: return "C+"
    if score >= 35: return "C"
    if score >= 25: return "D"
    return "F"

def grade_colour(grade: str) -> str:
    if grade in ("A+","A"):  return GREEN
    if grade in ("B+","B"):  return LIGHT_GREEN
    if grade in ("C+","C"):  return AMBER
    return RED

# ─────────────────────────────────────────────────────────────────────────────
# CORE SCORING ALGORITHM (Python port of sustainability.service.ts)
# ─────────────────────────────────────────────────────────────────────────────
def compute_score(items: list[dict]) -> dict:
    """
    Returns full score breakdown matching the TypeScript algorithm exactly.
    Each item dict: {id, name, brand, category, color, wear_count, added_days_ago}
    """
    total   = len(items)
    grace   = NEW_ITEM_GRACE_DAYS

    # ── Penalty 1: wardrobe size ──────────────────────────────────────────────
    excess        = max(0, total - WARDROBE_SIZE_THRESHOLD)
    size_penalty  = excess

    # ── Penalty 2: fast fashion ───────────────────────────────────────────────
    ff_items      = [i for i in items if is_fast_fashion(i.get("brand",""))]
    ff_brands     = list({i["brand"] for i in ff_items if i.get("brand")})
    ff_penalty    = len(ff_items)

    # ── Penalty 3: duplicate / similar ───────────────────────────────────────
    groups: dict[str, list] = {}
    for item in items:
        key = f"{item['category'].lower()}::{(item.get('color') or 'unknown').lower()}"
        groups.setdefault(key, []).append(item)

    similarity_groups = []
    sim_penalty       = 0
    for key, grp in groups.items():
        if len(grp) > SIMILARITY_THRESHOLD:
            cat, col = key.split("::")
            excess_c = len(grp) - SIMILARITY_THRESHOLD
            sim_penalty += excess_c
            similarity_groups.append({
                "category": cat, "colour": col,
                "total": len(grp), "excess": excess_c,
                "examples": [g["name"] for g in grp[:3]],
            })

    # ── Penalty 4: low utilisation ────────────────────────────────────────────
    low_wear_items = [
        i for i in items
        if i.get("added_days_ago", 999) > grace
        and i.get("wear_count", 0) <= LOW_WEAR_THRESHOLD
    ]
    low_wear_penalty = len(low_wear_items)

    # ── Bonus: high wear ─────────────────────────────────────────────────────
    high_wear_items = [i for i in items if i.get("wear_count", 0) >= HIGH_WEAR_THRESHOLD]
    raw_bonus       = len(high_wear_items) * 0.5
    hw_bonus        = min(HIGH_WEAR_BONUS_CAP, raw_bonus)

    # ── Final ────────────────────────────────────────────────────────────────
    total_penalty = size_penalty + ff_penalty + sim_penalty + low_wear_penalty
    final         = max(0, min(100, 100 - total_penalty + hw_bonus))
    grade         = score_to_grade(final)

    # Human-readable summary lines
    summary = [f"Your wardrobe has {total} active items (threshold: {WARDROBE_SIZE_THRESHOLD})."]
    if size_penalty > 0:
        summary.append(f"Wardrobe too large: {excess} item{'s' if excess != 1 else ''} over {WARDROBE_SIZE_THRESHOLD}-item threshold → –{size_penalty} pts")
    if ff_penalty > 0:
        summary.append(f"Fast-fashion brands: {len(ff_items)} item{'s' if len(ff_items) != 1 else ''} from {', '.join(ff_brands[:3])} → –{ff_penalty} pts")
    if sim_penalty > 0:
        descs = [f"{g['excess']} extra {g['colour']} {g['category']}" for g in similarity_groups]
        summary.append(f"Too many similar items: {', '.join(descs)} → –{sim_penalty} pts")
    if low_wear_penalty > 0:
        summary.append(f"{low_wear_penalty} item{'s' if low_wear_penalty != 1 else ''} barely used (worn ≤{LOW_WEAR_THRESHOLD}×, owned 60+ days) → –{low_wear_penalty} pts")
    if hw_bonus > 0:
        summary.append(f"{len(high_wear_items)} item{'s' if len(high_wear_items) != 1 else ''} worn {HIGH_WEAR_THRESHOLD}+ times → +{round(hw_bonus,1)} pts")
    summary.append(f"Final: 100 (base) – {total_penalty} (penalties) + {round(hw_bonus,1)} (bonuses) = {round(final,1)} → Grade {grade}")

    return {
        "base": 100,
        "final": round(final, 1),
        "grade": grade,
        "total_penalty": total_penalty,
        "total_bonus": round(hw_bonus, 1),
        "items_analysed": total,
        "summary": summary,
        "penalties": {
            "size":         {"excess": excess,             "penalty": size_penalty},
            "fast_fashion": {"count": len(ff_items),       "brands": ff_brands,   "penalty": ff_penalty},
            "similarity":   {"groups": similarity_groups,  "penalty": sim_penalty},
            "low_wear":     {"items": low_wear_items,      "penalty": low_wear_penalty},
        },
        "bonuses": {"high_wear": {"count": len(high_wear_items), "bonus": round(hw_bonus, 1)}},
    }

# ─────────────────────────────────────────────────────────────────────────────
# MOCK DATA
# ─────────────────────────────────────────────────────────────────────────────
def default_wardrobe() -> list[dict]:
    items = [
        # Basics – well worn
        {"id":"1",  "name":"Classic White Tee",       "brand":"Everlane",   "category":"Tops",    "color":"White",  "wear_count":22, "added_days_ago":400, "condition":"good",    "in_rtpw":False},
        {"id":"2",  "name":"Black Jeans",              "brand":"Levi's",     "category":"Bottoms", "color":"Black",  "wear_count":18, "added_days_ago":600, "condition":"good",    "in_rtpw":False},
        {"id":"3",  "name":"Navy Hoodie",              "brand":"Patagonia",  "category":"Tops",    "color":"Navy",   "wear_count":15, "added_days_ago":300, "condition":"good",    "in_rtpw":False},
        # Fast fashion items
        {"id":"4",  "name":"Floral Mini Dress",        "brand":"Zara",       "category":"Dresses", "color":"Pink",   "wear_count":1,  "added_days_ago":120, "condition":"like_new","in_rtpw":False},
        {"id":"5",  "name":"Striped Crop Top",         "brand":"H&M",        "category":"Tops",    "color":"White",  "wear_count":3,  "added_days_ago":180, "condition":"good",    "in_rtpw":False},
        {"id":"6",  "name":"Sequin Party Top",         "brand":"Shein",      "category":"Tops",    "color":"Gold",   "wear_count":1,  "added_days_ago":200, "condition":"like_new","in_rtpw":False},
        {"id":"7",  "name":"Leopard Print Blouse",     "brand":"Boohoo",     "category":"Tops",    "color":"Brown",  "wear_count":0,  "added_days_ago":150, "condition":"new",     "in_rtpw":False},
        # White tops (similarity group)
        {"id":"8",  "name":"White Linen Shirt",        "brand":"Cos",        "category":"Tops",    "color":"White",  "wear_count":8,  "added_days_ago":500, "condition":"good",    "in_rtpw":False},
        {"id":"9",  "name":"White Button-Down",        "brand":"Uniqlo",     "category":"Tops",    "color":"White",  "wear_count":5,  "added_days_ago":350, "condition":"good",    "in_rtpw":False},
        {"id":"10", "name":"White Graphic Tee",        "brand":"H&M",        "category":"Tops",    "color":"White",  "wear_count":4,  "added_days_ago":270, "condition":"good",    "in_rtpw":False},
        {"id":"11", "name":"White Polo Shirt",         "brand":"Zara",       "category":"Tops",    "color":"White",  "wear_count":2,  "added_days_ago":240, "condition":"good",    "in_rtpw":False},
        {"id":"12", "name":"White Ribbed Tank",        "brand":"Primark",    "category":"Tops",    "color":"White",  "wear_count":6,  "added_days_ago":220, "condition":"good",    "in_rtpw":False},
        {"id":"13", "name":"White Oversized Tee",      "brand":"Shein",      "category":"Tops",    "color":"White",  "wear_count":1,  "added_days_ago":190, "condition":"like_new","in_rtpw":False},
        # Outerwear – sustainable
        {"id":"14", "name":"Wool Camel Coat",          "brand":"Arket",      "category":"Outerwear","color":"Camel", "wear_count":12, "added_days_ago":700, "condition":"good",    "in_rtpw":False},
        {"id":"15", "name":"Denim Jacket",             "brand":"Levi's",     "category":"Outerwear","color":"Blue",  "wear_count":9,  "added_days_ago":500, "condition":"good",    "in_rtpw":False},
        # Barely worn
        {"id":"16", "name":"Red Sequin Skirt",         "brand":"Zara",       "category":"Bottoms", "color":"Red",   "wear_count":1,  "added_days_ago":300, "condition":"like_new","in_rtpw":False},
        {"id":"17", "name":"Neon Green Crop Jacket",   "brand":"Shein",      "category":"Outerwear","color":"Green", "wear_count":0,  "added_days_ago":250, "condition":"new",     "in_rtpw":False},
        {"id":"18", "name":"Oversized Blazer (Grey)",  "brand":"Mango",      "category":"Outerwear","color":"Grey",  "wear_count":2,  "added_days_ago":310, "condition":"good",    "in_rtpw":False},
        # Sustainable picks
        {"id":"19", "name":"Linen Trousers",           "brand":"Thought",    "category":"Bottoms", "color":"Beige", "wear_count":14, "added_days_ago":400, "condition":"good",    "in_rtpw":False},
        {"id":"20", "name":"Organic Cotton Dress",     "brand":"People Tree", "category":"Dresses","color":"Green", "wear_count":11, "added_days_ago":450, "condition":"good",    "in_rtpw":False},
    ]
    return items

def default_wanted() -> list[dict]:
    return [
        {"id":"w1","description":"Looking for a warm navy wool jumper, size M","category":"Tops","colors":["Navy","Blue"],"added":"2 days ago"},
        {"id":"w2","description":"Need black wide-leg trousers for work, any brand","category":"Bottoms","colors":["Black"],"added":"5 days ago"},
    ]

def default_rtpw_candidates() -> list[dict]:
    """Other users' RTPW items available for matching."""
    return [
        {"id":"r1","item":"Navy Knit Jumper",   "user":"sophie_m",  "category":"Tops",    "color":"Navy",  "condition":"good",    "match_score":88},
        {"id":"r2","item":"Merino Wool Sweater","user":"tom_k",     "category":"Tops",    "color":"Navy",  "condition":"like_new","match_score":72},
        {"id":"r3","item":"Dark Navy Pullover", "user":"elena_v",   "category":"Tops",    "color":"Navy",  "condition":"good",    "match_score":65},
    ]

# ─────────────────────────────────────────────────────────────────────────────
# SESSION STATE INIT
# ─────────────────────────────────────────────────────────────────────────────
if "wardrobe" not in st.session_state:
    st.session_state.wardrobe  = default_wardrobe()
if "wanted"   not in st.session_state:
    st.session_state.wanted    = default_wanted()
if "rtpw"     not in st.session_state:
    st.session_state.rtpw      = []
if "matches"  not in st.session_state:
    st.session_state.matches   = []
if "events"   not in st.session_state:
    st.session_state.events    = []
if "profile"  not in st.session_state:
    st.session_state.profile   = {"name":"Alex","age":27,"gender":"Female","city":"Berlin","style_tags":["Minimalist","Casual","Sustainable"]}

# ─────────────────────────────────────────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown(f"## 👗 WearAware")
    st.markdown(f"**{st.session_state.profile['name']}** · {st.session_state.profile['city']}")
    score_data = compute_score(st.session_state.wardrobe)
    grade      = score_data["grade"]
    score      = score_data["final"]
    gcol       = grade_colour(grade)

    st.markdown(
        f"""<div style="background:{gcol};border-radius:12px;padding:16px;text-align:center;margin:8px 0">
        <div style="font-size:2.2rem;font-weight:bold;color:white">{grade}</div>
        <div style="color:white;opacity:.9;font-size:.9rem">Sustainability Score: {score}/100</div>
        </div>""",
        unsafe_allow_html=True,
    )

    st.markdown("---")
    page = st.radio(
        "Navigate",
        ["🏠 Dashboard", "👚 My Wardrobe", "♻️ Score Breakdown", "🔄 Swaps & Matching", "📊 Analytics", "🏪 Partner Stores"],
        label_visibility="collapsed",
    )

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def metric_card(label, value, delta=None, colour=NAVY):
    delta_html = ""
    if delta is not None:
        colour_d = GREEN if delta >= 0 else RED
        arrow    = "▲" if delta >= 0 else "▼"
        delta_html = f'<div style="color:{colour_d};font-size:.85rem">{arrow} {abs(delta)} pts</div>'
    st.markdown(
        f"""<div style="background:{CARD_BG};border:1px solid #E2E8F0;border-radius:10px;
        padding:16px 20px;margin-bottom:8px">
        <div style="color:#64748B;font-size:.8rem;font-weight:600;text-transform:uppercase">{label}</div>
        <div style="color:{colour};font-size:1.8rem;font-weight:700;line-height:1.2">{value}</div>
        {delta_html}
        </div>""",
        unsafe_allow_html=True,
    )

def penalty_row(label, penalty, detail):
    colour = RED if penalty > 0 else GREEN
    icon   = "🔴" if penalty > 0 else "🟢"
    st.markdown(
        f"""<div style="display:flex;align-items:center;justify-content:space-between;
        background:{CARD_BG};border:1px solid #E2E8F0;border-radius:8px;
        padding:12px 16px;margin-bottom:6px">
        <div>{icon} <b>{label}</b><br>
        <span style="color:#64748B;font-size:.82rem">{detail}</span></div>
        <div style="color:{colour};font-weight:700;font-size:1.1rem;min-width:60px;text-align:right">
        {"–" if penalty>0 else ""}{penalty} pts</div>
        </div>""",
        unsafe_allow_html=True,
    )

# ─────────────────────────────────────────────────────────────────────────────
# PAGE: DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────
if page == "🏠 Dashboard":
    st.title("🏠 Dashboard")
    st.caption("Your wardrobe health at a glance")

    bd = compute_score(st.session_state.wardrobe)

    c1, c2, c3, c4 = st.columns(4)
    with c1: metric_card("Sustainability Score", f"{bd['final']}/100", colour=grade_colour(bd['grade']))
    with c2: metric_card("Wardrobe Items",       len(st.session_state.wardrobe))
    with c3: metric_card("Total Penalty",        f"–{bd['total_penalty']} pts", colour=RED)
    with c4: metric_card("Wear Bonus",           f"+{bd['total_bonus']} pts",   colour=GREEN)

    st.markdown("---")
    col_l, col_r = st.columns([1.4, 1])

    with col_l:
        st.subheader("📋 Score Breakdown Summary")
        for line in bd["summary"]:
            icon = "✅" if "No penalty" in line or "+" in line else ("⚠️" if "–" in line else "ℹ️")
            st.markdown(f"{icon} {line}")

    with col_r:
        st.subheader("🧮 Score Waterfall")
        cats   = ["Base","Size","Fast Fashion","Duplicates","Low Wear","Bonus","Final"]
        vals   = [
            100,
            -bd["penalties"]["size"]["penalty"],
            -bd["penalties"]["fast_fashion"]["penalty"],
            -bd["penalties"]["similarity"]["penalty"],
            -bd["penalties"]["low_wear"]["penalty"],
            bd["bonuses"]["high_wear"]["bonus"],
            0,
        ]
        colours_w = [
            "#64748B","#EF4444","#EF4444","#EF4444","#EF4444",
            "#2E7D52", grade_colour(bd["grade"]),
        ]
        # Build running total for waterfall
        running = 100
        bar_vals, bar_bases, bar_colors, bar_labels = [], [], [], []
        for i, (cat, v) in enumerate(zip(cats, vals)):
            if cat == "Base":
                bar_vals.append(100); bar_bases.append(0); bar_colors.append("#64748B"); bar_labels.append("100")
            elif cat == "Final":
                bar_vals.append(bd["final"]); bar_bases.append(0); bar_colors.append(grade_colour(bd["grade"])); bar_labels.append(str(bd["final"]))
            else:
                bar_vals.append(abs(v)); bar_bases.append(min(running, running+v)); bar_colors.append(colours_w[i]); bar_labels.append(str(v) if v < 0 else f"+{v}")
                running += v

        fig = go.Figure(go.Bar(
            x=cats, y=bar_vals, base=bar_bases,
            marker_color=bar_colors,
            text=bar_labels, textposition="outside",
        ))
        fig.update_layout(
            height=320, showlegend=False,
            margin=dict(l=0,r=0,t=10,b=0),
            plot_bgcolor="white", paper_bgcolor="white",
            yaxis=dict(range=[0,115], showgrid=True, gridcolor="#F1F5F9"),
        )
        st.plotly_chart(fig, width="stretch")

    st.markdown("---")
    st.subheader("⚡ Quick Actions")
    qa1, qa2, qa3 = st.columns(3)
    with qa1:
        if st.button("➕ Add Clothing Item", width="stretch"):
            st.session_state["_nav"] = "👚 My Wardrobe"
            st.rerun()
    with qa2:
        if st.button("🔄 Re-compute Score", width="stretch"):
            st.success("Score recomputed from your current wardrobe!")
            st.rerun()
    with qa3:
        if st.button("🔍 Find a Swap Match", width="stretch"):
            st.info("Head to Swaps & Matching to browse candidates!")

# ─────────────────────────────────────────────────────────────────────────────
# PAGE: MY WARDROBE
# ─────────────────────────────────────────────────────────────────────────────
elif page == "👚 My Wardrobe":
    st.title("👚 My Wardrobe")

    tab_browse, tab_add = st.tabs(["Browse Items", "Add New Item"])

    with tab_browse:
        cats = ["All"] + sorted({i["category"] for i in st.session_state.wardrobe})
        f_cat = st.selectbox("Filter by category", cats)

        items = st.session_state.wardrobe
        if f_cat != "All":
            items = [i for i in items if i["category"] == f_cat]

        st.caption(f"Showing {len(items)} of {len(st.session_state.wardrobe)} items")

        EMOJIS = {"Tops":"👕","Bottoms":"👖","Dresses":"👗","Outerwear":"🧥","Footwear":"👟","Accessories":"👜","Other":"📦"}

        for idx in range(0, len(items), 3):
            cols = st.columns(3)
            for ci, item in enumerate(items[idx:idx+3]):
                with cols[ci]:
                    ff_badge = "🚨 Fast Fashion" if is_fast_fashion(item.get("brand","")) else ""
                    wear_col = GREEN if item["wear_count"] >= HIGH_WEAR_THRESHOLD else (AMBER if item["wear_count"] >= 3 else RED)
                    st.markdown(
                        f"""<div style="background:{CARD_BG};border:1px solid #E2E8F0;border-radius:10px;padding:14px;margin-bottom:8px">
                        <div style="font-size:1.8rem;text-align:center">{EMOJIS.get(item['category'],'👔')}</div>
                        <div style="font-weight:600;margin-top:6px">{item['name']}</div>
                        <div style="color:#64748B;font-size:.82rem">{item.get('brand','No brand')} · {item['color']} · {item['category']}</div>
                        <div style="color:{wear_col};font-size:.82rem;margin-top:4px">Worn {item['wear_count']}× {'✅' if item['wear_count']>=HIGH_WEAR_THRESHOLD else ''}</div>
                        {"<div style='color:#EF4444;font-size:.78rem;font-weight:600;margin-top:2px'>" + ff_badge + "</div>" if ff_badge else ""}
                        </div>""",
                        unsafe_allow_html=True,
                    )
                    col_w, col_rtpw = st.columns(2)
                    with col_w:
                        if st.button("👕 Worn today", key=f"wear_{item['id']}", width="stretch"):
                            for w in st.session_state.wardrobe:
                                if w["id"] == item["id"]:
                                    w["wear_count"] += 1
                            st.rerun()
                    with col_rtpw:
                        already_rtpw = any(r["item_id"] == item["id"] for r in st.session_state.rtpw)
                        if already_rtpw:
                            st.button("✅ In RTPW", key=f"rtpw_{item['id']}", disabled=True, width="stretch")
                        else:
                            if st.button("♻️ Part with", key=f"rtpw_{item['id']}", width="stretch"):
                                st.session_state.rtpw.append({"item_id": item["id"], "item_name": item["name"], "category": item["category"], "color": item["color"]})
                                st.success(f"'{item['name']}' added to Ready-to-Part-With!")
                                st.rerun()

    with tab_add:
        st.subheader("Add a new item to your wardrobe")
        with st.form("add_item_form"):
            c1, c2 = st.columns(2)
            with c1:
                name     = st.text_input("Item name *")
                brand    = st.text_input("Brand")
                category = st.selectbox("Category *", ["Tops","Bottoms","Dresses","Outerwear","Footwear","Accessories","Other"])
            with c2:
                color       = st.text_input("Primary colour")
                wear_count  = st.number_input("Times already worn", min_value=0, value=0)
                condition   = st.selectbox("Condition", ["new","like_new","good","fair","worn"])

            submitted = st.form_submit_button("➕ Add to Wardrobe", width="stretch")
            if submitted:
                if not name:
                    st.error("Item name is required.")
                else:
                    ff_warn = is_fast_fashion(brand)
                    new_item = {
                        "id":            str(len(st.session_state.wardrobe) + 100),
                        "name":          name,
                        "brand":         brand,
                        "category":      category,
                        "color":         color or "Unknown",
                        "wear_count":    wear_count,
                        "added_days_ago": 0,
                        "condition":     condition,
                        "in_rtpw":       False,
                    }
                    st.session_state.wardrobe.append(new_item)
                    if ff_warn:
                        st.warning(f"⚠️ **Fast fashion alert!** '{brand}' is a fast-fashion brand. This item will add –1 to your sustainability score. Consider a second-hand alternative.")
                    else:
                        st.success(f"✅ '{name}' added to your wardrobe!")
                    st.rerun()

# ─────────────────────────────────────────────────────────────────────────────
# PAGE: SCORE BREAKDOWN (Transparency panel)
# ─────────────────────────────────────────────────────────────────────────────
elif page == "♻️ Score Breakdown":
    st.title("♻️ Sustainability Score Breakdown")
    st.caption("Full transparency — here's exactly how every point is calculated")

    bd = compute_score(st.session_state.wardrobe)

    # Score gauge
    fig_gauge = go.Figure(go.Indicator(
        mode  = "gauge+number",
        value = bd["final"],
        title = {"text": f"Grade: {bd['grade']}", "font": {"size": 20}},
        gauge = {
            "axis":  {"range": [0, 100]},
            "bar":   {"color": grade_colour(bd["grade"])},
            "steps": [
                {"range": [0,  25], "color": "#FEE2E2"},
                {"range": [25, 50], "color": "#FEF3C7"},
                {"range": [50, 75], "color": "#D1FAE5"},
                {"range": [75,100], "color": "#A7F3D0"},
            ],
            "threshold": {"line": {"color": NAVY,"width": 3}, "value": bd["final"]},
        },
        number = {"suffix": "/100"},
    ))
    fig_gauge.update_layout(height=260, margin=dict(l=20,r=20,t=40,b=10))
    st.plotly_chart(fig_gauge, width="stretch")

    # ── Algorithm explainer ──────────────────────────────────────────────────
    st.markdown("---")
    st.subheader("📐 How Your Score is Calculated")
    st.markdown(
        f"""
| Step | Rule | Points |
|------|------|--------|
| **Base** | Every user starts here | **+100** |
| **Wardrobe size** | −1 per item **over {WARDROBE_SIZE_THRESHOLD}** in your wardrobe | −{bd['penalties']['size']['penalty']} |
| **Fast fashion** | −1 per item from a fast-fashion brand | −{bd['penalties']['fast_fashion']['penalty']} |
| **Duplicate items** | −1 per item over **{SIMILARITY_THRESHOLD}** in the same category+colour | −{bd['penalties']['similarity']['penalty']} |
| **Low utilisation** | −1 per item worn **≤{LOW_WEAR_THRESHOLD}×** (owned 60+ days) | −{bd['penalties']['low_wear']['penalty']} |
| **High wear bonus** | +0.5 per item worn **{HIGH_WEAR_THRESHOLD}+** times (max +10) | +{bd['bonuses']['high_wear']['bonus']} |
| | **Final Score** | **{bd['final']}** |
"""
    )

    # ── Penalty cards ────────────────────────────────────────────────────────
    st.markdown("---")
    st.subheader("🔍 Penalty Detail")

    p = bd["penalties"]
    penalty_row(
        "📦 Wardrobe Size",
        p["size"]["penalty"],
        f"You have {bd['items_analysed']} items. {p['size']['excess']} items over the {WARDROBE_SIZE_THRESHOLD}-item threshold × –1 = –{p['size']['penalty']} pts",
    )
    penalty_row(
        "🏭 Fast Fashion Brands",
        p["fast_fashion"]["penalty"],
        f"{p['fast_fashion']['count']} items from: {', '.join(p['fast_fashion']['brands']) if p['fast_fashion']['brands'] else 'none detected'} × –1 = –{p['fast_fashion']['penalty']} pts",
    )
    penalty_row(
        "👯 Duplicate Items",
        p["similarity"]["penalty"],
        (", ".join(f"{g['excess']} extra {g['colour']} {g['category']}" for g in p["similarity"]["groups"])
         or f"No groups over {SIMILARITY_THRESHOLD} similar items") + f" = –{p['similarity']['penalty']} pts",
    )
    penalty_row(
        "😴 Low Utilisation",
        p["low_wear"]["penalty"],
        f"{len(p['low_wear']['items'])} items worn ≤{LOW_WEAR_THRESHOLD}× (excl. items added in the last {NEW_ITEM_GRACE_DAYS} days) × –1 = –{p['low_wear']['penalty']} pts",
    )

    # Bonus card
    bh = bd["bonuses"]["high_wear"]
    if bh["bonus"] > 0:
        st.markdown(
            f"""<div style="display:flex;align-items:center;justify-content:space-between;
            background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:12px 16px;margin-bottom:6px">
            <div>🟢 <b>High-Wear Bonus</b><br>
            <span style="color:#64748B;font-size:.82rem">{bh['count']} items worn {HIGH_WEAR_THRESHOLD}+ times × +0.5 (capped at +{HIGH_WEAR_BONUS_CAP})</span></div>
            <div style="color:{GREEN};font-weight:700;font-size:1.1rem">+{bh['bonus']} pts</div>
            </div>""",
            unsafe_allow_html=True,
        )

    # ── Fast fashion items list ───────────────────────────────────────────────
    if p["fast_fashion"]["count"] > 0:
        st.markdown("---")
        st.subheader("🚨 Fast Fashion Items in Your Wardrobe")
        ff_data = [
            {"Item": i["name"], "Brand": i.get("brand",""), "Worn": i["wear_count"],
             "Penalty": "–1 pt"}
            for i in st.session_state.wardrobe
            if is_fast_fashion(i.get("brand",""))
        ]
        st.dataframe(pd.DataFrame(ff_data), width="stretch", hide_index=True)

    # ── Low-wear items list ───────────────────────────────────────────────────
    if p["low_wear"]["penalty"] > 0:
        st.markdown("---")
        st.subheader("😴 Barely-Used Items")
        lw_data = [
            {"Item": i["name"], "Brand": i.get("brand","Unknown"), "Category": i["category"],
             "Worn": i["wear_count"], "Owned (days)": i.get("added_days_ago","?"), "Penalty": "–1 pt"}
            for i in p["low_wear"]["items"]
        ]
        st.dataframe(pd.DataFrame(lw_data), width="stretch", hide_index=True)

    # ── Recompute button ─────────────────────────────────────────────────────
    st.markdown("---")
    if st.button("🔄 Recompute Score Now", width="stretch", type="primary"):
        st.success(f"Score recomputed: **{bd['final']}/100 (Grade {bd['grade']})**")
        st.rerun()

# ─────────────────────────────────────────────────────────────────────────────
# PAGE: SWAPS & MATCHING
# ─────────────────────────────────────────────────────────────────────────────
elif page == "🔄 Swaps & Matching":
    st.title("🔄 Swaps & Matching")
    st.caption("Drag items to 'Ready to Part With', find matches, reduce waste together.")

    tab_rtpw, tab_wanted, tab_matches = st.tabs(["♻️ Ready to Part With", "🔍 Wanted Items", "🤝 Match Results"])

    with tab_rtpw:
        st.subheader("Your Ready-to-Part-With Collection")
        if not st.session_state.rtpw:
            st.info("No items yet. Go to **My Wardrobe** and click '♻️ Part with' on any item.")
        else:
            for rtpw_item in st.session_state.rtpw:
                c1, c2 = st.columns([4, 1])
                with c1:
                    st.markdown(f"**{rtpw_item['item_name']}** · {rtpw_item['category']} · {rtpw_item['color']}")
                with c2:
                    if st.button("Remove", key=f"rem_{rtpw_item['item_id']}"):
                        st.session_state.rtpw = [r for r in st.session_state.rtpw if r["item_id"] != rtpw_item["item_id"]]
                        st.rerun()
            st.markdown("---")
            st.info(f"💡 You have **{len(st.session_state.rtpw)}** item(s) ready to swap. When matched, you'll earn **+12 sustainability points**!")

    with tab_wanted:
        st.subheader("What You're Looking For")
        for w in st.session_state.wanted:
            with st.container(border=True):
                st.markdown(f"**{w['category']}** — {w['description']}")
                st.caption(f"Preferred colours: {', '.join(w['colors'])} · Added {w['added']}")
                if st.button("🔍 Find Matches", key=f"find_{w['id']}", width="stretch"):
                    st.session_state["_active_wanted"] = w["id"]
                    st.rerun()

        st.markdown("---")
        with st.expander("➕ Add a Wanted Item"):
            with st.form("wanted_form"):
                desc     = st.text_area("Describe what you're looking for")
                wcat     = st.selectbox("Category", ["Tops","Bottoms","Dresses","Outerwear","Other"])
                wcolours = st.text_input("Preferred colours (comma-separated)")
                if st.form_submit_button("Add to Wanted List"):
                    if desc:
                        st.session_state.wanted.append({
                            "id": f"w{len(st.session_state.wanted)+10}",
                            "description": desc,
                            "category": wcat,
                            "colors": [c.strip() for c in wcolours.split(",") if c.strip()],
                            "added": "just now",
                        })
                        st.success("Added to your wanted list!")
                        st.rerun()

    with tab_matches:
        st.subheader("🤝 Community Match Results")
        st.caption("Items from other users' RTPW collections that match your wanted items")

        candidates = default_rtpw_candidates()
        for c in candidates:
            with st.container(border=True):
                cols = st.columns([3,1,1])
                with cols[0]:
                    st.markdown(f"**{c['item']}**")
                    st.caption(f"From **@{c['user']}** · {c['category']} · {c['color']} · Condition: {c['condition']}")
                with cols[1]:
                    match_col = GREEN if c["match_score"]>=70 else AMBER
                    st.markdown(
                        f'<div style="background:{match_col};color:white;border-radius:8px;padding:6px 12px;text-align:center;font-weight:bold">{c["match_score"]}%<br><span style="font-size:.72rem">match</span></div>',
                        unsafe_allow_html=True,
                    )
                with cols[2]:
                    if st.button("✉️ Connect", key=f"conn_{c['id']}", width="stretch"):
                        st.session_state.matches.append(c)
                        st.balloons()
                        st.success(f"🎉 Match request sent to @{c['user']}! Once accepted, both of you earn +12 sustainability points.")
                        st.rerun()

        if st.session_state.matches:
            st.markdown("---")
            st.subheader("📬 Your Sent Proposals")
            for m in st.session_state.matches:
                st.markdown(f"✅ **{m['item']}** → @{m['user']} — pending acceptance")

# ─────────────────────────────────────────────────────────────────────────────
# PAGE: ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────
elif page == "📊 Analytics":
    st.title("📊 Analytics & Insights")

    bd = compute_score(st.session_state.wardrobe)
    items = st.session_state.wardrobe

    tab_wardrobe, tab_score, tab_insights = st.tabs(["Wardrobe Stats", "Score Trend", "Insights"])

    with tab_wardrobe:
        c1, c2 = st.columns(2)

        # Category breakdown
        with c1:
            st.subheader("Category Breakdown")
            cat_counts = {}
            for i in items:
                cat_counts[i["category"]] = cat_counts.get(i["category"], 0) + 1
            fig_cat = px.pie(
                names=list(cat_counts.keys()),
                values=list(cat_counts.values()),
                hole=0.45,
                color_discrete_sequence=px.colors.qualitative.Set3,
            )
            fig_cat.update_layout(height=300, margin=dict(l=0,r=0,t=20,b=0))
            st.plotly_chart(fig_cat, width="stretch")

        # Fast fashion vs sustainable split
        with c2:
            st.subheader("Brand Ethics Split")
            ff_count  = sum(1 for i in items if is_fast_fashion(i.get("brand","")))
            sus_count = len(items) - ff_count
            fig_brand = go.Figure(go.Pie(
                labels=["Fast Fashion 🚨", "Other / Sustainable ✅"],
                values=[ff_count, sus_count],
                hole=0.45,
                marker_colors=[RED, GREEN],
            ))
            fig_brand.update_layout(height=300, margin=dict(l=0,r=0,t=20,b=0))
            st.plotly_chart(fig_brand, width="stretch")

        # Wear frequency distribution
        st.subheader("Wear Frequency Distribution")
        wear_buckets = {"Never (0×)":0, "Barely (1–2×)":0, "Moderate (3–9×)":0, "Frequently (10+×)":0}
        for i in items:
            w = i.get("wear_count", 0)
            if w == 0:             wear_buckets["Never (0×)"] += 1
            elif w <= 2:           wear_buckets["Barely (1–2×)"] += 1
            elif w < HIGH_WEAR_THRESHOLD: wear_buckets["Moderate (3–9×)"] += 1
            else:                  wear_buckets["Frequently (10+×)"] += 1

        fig_wear = go.Figure(go.Bar(
            x=list(wear_buckets.keys()),
            y=list(wear_buckets.values()),
            marker_color=[RED, AMBER, LIGHT_GREEN, GREEN],
            text=list(wear_buckets.values()),
            textposition="outside",
        ))
        fig_wear.update_layout(
            height=280, showlegend=False,
            margin=dict(l=0,r=0,t=20,b=0),
            plot_bgcolor="white", paper_bgcolor="white",
            yaxis=dict(showgrid=True, gridcolor="#F1F5F9"),
        )
        st.plotly_chart(fig_wear, width="stretch")

    with tab_score:
        st.subheader("Score Trend (Simulated – last 90 days)")

        # Generate a realistic synthetic trend based on the current score
        today      = date.today()
        trend_days = 90
        base_trend = 50
        random.seed(42)
        trend_scores = [base_trend]
        events_text  = []
        for day_offset in range(trend_days - 1):
            delta = random.gauss(0.2, 1.5)
            trend_scores.append(round(max(0, min(100, trend_scores[-1] + delta)), 1))
        # Simulate key events
        trend_scores[20]  = min(100, trend_scores[20] + 12)
        events_text_map   = {20: "Swap +12", 50: "Donation +8", 70: "Purchase –5"}
        trend_scores[50]  = min(100, trend_scores[50] + 8)
        trend_scores[70]  = max(0,   trend_scores[70] - 5)
        trend_scores[-1]  = bd["final"]

        dates = [today - timedelta(days=trend_days - i - 1) for i in range(trend_days)]

        fig_trend = go.Figure()
        fig_trend.add_trace(go.Scatter(
            x=dates, y=trend_scores,
            mode="lines+markers",
            line=dict(color=GREEN, width=2.5),
            marker=dict(size=4),
            fill="tozeroy",
            fillcolor="rgba(46,125,82,0.08)",
            name="Score",
        ))
        # Event annotations
        for day_i, label in events_text_map.items():
            fig_trend.add_annotation(
                x=dates[day_i], y=trend_scores[day_i],
                text=label, showarrow=True, arrowhead=2,
                font=dict(size=11), bgcolor="white", bordercolor=GREEN,
            )

        fig_trend.update_layout(
            height=350, showlegend=False,
            margin=dict(l=0,r=0,t=20,b=0),
            plot_bgcolor="white", paper_bgcolor="white",
            yaxis=dict(range=[0,110], gridcolor="#F1F5F9", showgrid=True),
            xaxis=dict(showgrid=False),
        )
        st.plotly_chart(fig_trend, width="stretch")

    with tab_insights:
        st.subheader("💡 AI Sustainability Insights")

        p = bd["penalties"]
        insights = []

        never_worn = sum(1 for i in items if i.get("wear_count",0) == 0 and i.get("added_days_ago",999) > 60)
        never_pct  = round(never_worn / max(len(items),1) * 100)

        if never_pct > 30:
            insights.append(("🔴 High", f"{never_pct}% of your wardrobe has **never been worn** — that's {never_worn} items that cost resources to produce but are sitting idle.", "Move them to your Ready-to-Part-With list and find a new home via a swap or donation."))
        elif never_pct > 10:
            insights.append(("🟡 Medium", f"{never_pct}% of your wardrobe has never been worn ({never_worn} items).", "Review items you haven't touched in 6 months and consider letting them go."))

        if p["fast_fashion"]["count"] > 0:
            insights.append(("🔴 High", f"**{p['fast_fashion']['count']} items** ({round(p['fast_fashion']['count']/max(len(items),1)*100)}%) are from fast-fashion brands. These brands produce 10× more collections than a decade ago.", "When replacing items, look for second-hand alternatives or ethical brands."))

        if p["similarity"]["groups"]:
            for g in p["similarity"]["groups"]:
                insights.append(("🟡 Medium", f"You own **{g['total']} {g['colour']} {g['category']}** — {g['excess']} more than the recommended {SIMILARITY_THRESHOLD}.", f"Consider passing {g['excess']} of them on. You only need so many {g['colour']} {g['category']}!"))

        if len(items) > WARDROBE_SIZE_THRESHOLD:
            insights.append(("🟡 Medium", f"Your wardrobe has **{len(items)} items** — {len(items)-WARDROBE_SIZE_THRESHOLD} over the recommended {WARDROBE_SIZE_THRESHOLD}.", "A curated capsule wardrobe is easier to use, causes less waste, and improves your score."))

        if bd["bonuses"]["high_wear"]["count"] > 0:
            insights.append(("🟢 Great", f"**{bd['bonuses']['high_wear']['count']} items** have been worn {HIGH_WEAR_THRESHOLD}+ times — you're getting maximum value from them!", "Keep up the great utilisation!"))

        if not insights:
            st.success("🎉 Your wardrobe looks great! No major sustainability concerns detected.")
        else:
            for severity, message, action in insights:
                bg = "#FEF2F2" if "High" in severity else ("#FFFBEB" if "Medium" in severity else "#F0FDF4")
                bd_col = "#FECACA" if "High" in severity else ("#FDE68A" if "Medium" in severity else "#BBF7D0")
                st.markdown(
                    f"""<div style="background:{bg};border-left:4px solid {bd_col};border-radius:0 8px 8px 0;
                    padding:12px 16px;margin-bottom:10px">
                    <div style="font-weight:600;margin-bottom:4px">{severity}</div>
                    <div style="margin-bottom:6px">{message}</div>
                    <div style="color:#475569;font-size:.85rem">💡 <i>{action}</i></div>
                    </div>""",
                    unsafe_allow_html=True,
                )

# ─────────────────────────────────────────────────────────────────────────────
# PAGE: PARTNER STORES
# ─────────────────────────────────────────────────────────────────────────────
elif page == "🏪 Partner Stores":
    st.title("🏪 Partner Stores Near You")
    st.caption("Donate items to local second-hand stores. Earn +8 sustainability points per donation.")

    stores = [
        {"name":"GreenThread Berlin",   "city":"Berlin",    "country":"Germany",      "commission":"15%", "email":"hello@greenthread.de"},
        {"name":"Second Stitch London", "city":"London",    "country":"UK",           "commission":"12.5%","email":"info@secondstitch.co.uk"},
        {"name":"Closet Cycle NYC",     "city":"New York",  "country":"USA",          "commission":"18%", "email":"closetcycle@nyc.com"},
        {"name":"Remake Amsterdam",     "city":"Amsterdam", "country":"Netherlands",  "commission":"14%", "email":"shop@remake.nl"},
        {"name":"Rewear Paris",         "city":"Paris",     "country":"France",       "commission":"16%", "email":"bonjour@rewear.fr"},
    ]

    f_city = st.text_input("Filter by city", placeholder="e.g. Berlin")
    filtered = [s for s in stores if f_city.lower() in s["city"].lower()] if f_city else stores

    for store in filtered:
        with st.container(border=True):
            c1, c2, c3 = st.columns([3,1,1])
            with c1:
                st.markdown(f"### 🏪 {store['name']}")
                st.caption(f"📍 {store['city']}, {store['country']} · ✉️ {store['email']}")
            with c2:
                st.markdown(f"**Commission**\n\n{store['commission']}")
            with c3:
                if st.button(f"Donate Here", key=f"donate_{store['name']}", width="stretch"):
                    if not st.session_state.rtpw:
                        st.warning("Add items to Ready-to-Part-With first!")
                    else:
                        st.success(f"✅ Donation request sent to **{store['name']}**! +8 sustainability points earned once received.")

    st.markdown("---")
    st.markdown(
        """**How our partner store model works:**
- You donate an item via the app
- The store lists it for sale
- When sold, **15% of the sale price** goes to WearAware
- You keep your **+8 sustainability score boost**
- The item gets a **second life** instead of landfill 🌱"""
    )
