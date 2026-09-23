# 42 Intra Logtime Extension

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-42%20Intra%20Logtime%20Hours%20Calculator-blue?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/42-intra-logtime-hours-ca/fhcallakdiljgegkajofpaofknkffplj?authuser=1&hl=en&pli=1)
[![Version](https://img.shields.io/badge/version-1.41-green.svg)](manifest.json)
[![Manifest](https://img.shields.io/badge/manifest-v3-orange.svg)](manifest.json)

A lightweight Google Chrome extension that dynamically calculates and displays logtime hours directly on the **42 Intra V3** and **Legacy** profile interfaces.

🔗 **Chrome Web Store Link**: [42 Intra Logtime Hours Calculator](https://chromewebstore.google.com/detail/42-intra-logtime-hours-ca/fhcallakdiljgegkajofpaofknkffplj?authuser=1&hl=en&pli=1)

---

## ✨ Features

- **⚡ Instant Monthly Calculation**: Automatically tallies up your total logtime hours for the active month as soon as you visit your 42 Intra profile.
- **📅 Interactive Drag-and-Select**: Click and drag across any calendar day cells on the logtime matrix to dynamically calculate custom date range totals.
- **🔄 Universal Compatibility**: Seamlessly works with both the modern 42 Intra V3 (`profile-v3.intra.42.fr`) and Legacy (`profile.intra.42.fr`, `intra.42.fr`) layouts.
- **🎨 Native UI Integration**: Features sleek styling, dark mode synergy, and non-intrusive overlays tailored for the 42 Intra design system.

---

## 🚀 How to Use

1. **Automatic Total**: Open your [42 Intra Profile](https://profile.intra.42.fr) — your monthly logtime total will display automatically.
2. **Custom Selection**: **Click and drag** across any sequence of days in the calendar grid to calculate the exact hours spent in that specific date range.
3. **Reset**: Click anywhere outside the calendar matrix to clear your custom selection.

---

## 🛠️ Local / Developer Installation

If you want to run or test this extension locally in developer mode:

1. Clone or download this repository:
   ```bash
   git clone https://github.com/NaderZico/42-Intra-Logtime-Extension.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click **Load unpacked** and select the repository directory.
5. Visit your 42 Intra profile to start using the extension.

---

## 📁 Repository Structure

```
├── manifest.json     # Chrome Extension Manifest V3 configuration
├── content.js        # Core DOM parser, timeline calculator, and drag-select engine
├── popup.html        # Extension popup quick-reference guide
├── icon.png          # 16x16 / 32x32 action icon
├── icon_large.png    # 128x128 extension icon
└── README.md         # Documentation & Chrome Web Store link
```

---

## 👤 Author

Developed by **[Nader Khalil (NaderZico)](https://github.com/NaderZico)**.
