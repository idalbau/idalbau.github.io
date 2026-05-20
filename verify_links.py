import os
import re
import xml.etree.ElementTree as ET

# Root directory of the repository
ROOT_DIR = r"c:\Users\daniel\Documents\GitHub\idalbau.github.io"
# Fallback to current directory if not found (in case of path nuances)
if not os.path.exists(ROOT_DIR):
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
    if not os.path.exists(os.path.join(ROOT_DIR, "index.html")):
        ROOT_DIR = os.getcwd()

print(f"Auditing repository at: {ROOT_DIR}\n")

# Find all HTML files
html_files = [f for f in os.listdir(ROOT_DIR) if f.endswith(".html")]

errors = []
warnings = []
hreflang_mappings = {}  # {file: {lang: url}}
canonical_mappings = {} # {file: url}

# GA4 measurement ID to verify
GA4_ID = "G-FXXM8ZF82P"

for file in html_files:
    file_path = os.path.join(ROOT_DIR, file)
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    print(f"=== Checking {file} ===")
    
    # 1. Check <html lang="...">
    lang_match = re.search(r'<html\s+lang=["\']([^"\']+)["\']', content, re.IGNORECASE)
    if not lang_match:
        errors.append(f"[{file}] Missing <html lang='...'> attribute.")
    else:
        lang = lang_match.group(1)
        print(f"  - Language: {lang}")
        if lang not in ["it", "de"]:
            warnings.append(f"[{file}] Language attribute '{lang}' is not 'it' or 'de'.")

    # 2. Check GA4 tracking script
    ga_script_present = f"https://www.googletagmanager.com/gtag/js?id={GA4_ID}" in content
    ga_config_present = f"gtag('config', '{GA4_ID}')" in content or f'gtag("config", "{GA4_ID}")' in content
    
    # Skip thank you page or policy if they don't have standard GA4 but check anyways
    if not ga_script_present:
        errors.append(f"[{file}] GA4 tracking script with ID {GA4_ID} not found in HTML head.")
    if not ga_config_present:
        errors.append(f"[{file}] GA4 gtag('config', '{GA4_ID}') initialization not found.")

    # 3. Check Canonical and Alternate Links
    canonical_match = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)["\']', content, re.IGNORECASE)
    if not canonical_match:
        errors.append(f"[{file}] Missing <link rel='canonical'> tag.")
    else:
        canonical_mappings[file] = canonical_match.group(1)

    alternates = re.findall(r'<link\s+rel=["\']alternate["\']\s+hreflang=["\']([^"\']+)["\']\s+href=["\']([^"\']+)["\']', content, re.IGNORECASE)
    # Check alternate format as well where attributes are swapped
    alternates_swapped = re.findall(r'<link\s+hreflang=["\']([^"\']+)["\']\s+rel=["\']alternate["\']\s+href=["\']([^"\']+)["\']', content, re.IGNORECASE)
    all_alternates = alternates + alternates_swapped
    
    hreflang_mappings[file] = {}
    for lang, href in all_alternates:
        hreflang_mappings[file][lang] = href
        
    print(f"  - Alternates: {hreflang_mappings[file]}")
    if "it" not in hreflang_mappings[file]:
        errors.append(f"[{file}] Missing hreflang='it' alternate link.")
    if "de" not in hreflang_mappings[file]:
        errors.append(f"[{file}] Missing hreflang='de' alternate link.")

    # 4. Check Internal Links
    links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\']', content, re.IGNORECASE)
    for link in links:
        # Ignore external links, mailto, tel, hashes
        if link.startswith(("http://", "https://", "mailto:", "tel:", "#")):
            # If it is self domain, check it
            if "idalbau.github.io" in link:
                path_part = link.split("idalbau.github.io/")[-1].split("#")[0]
                if path_part and path_part not in html_files and path_part != "":
                    errors.append(f"[{file}] Link to domain page '{link}' points to non-existent local file '{path_part}'.")
            continue
        
        # Strip query params or hash
        local_file = link.split("?")[0].split("#")[0]
        if not local_file:
            continue
            
        local_path = os.path.join(ROOT_DIR, local_file)
        if not os.path.exists(local_path):
            errors.append(f"[{file}] Link '{link}' points to non-existent file '{local_file}'.")

    # 5. Check Forms and Redirects
    form_matches = re.findall(r'<form\s+[^>]*action=["\']([^"\']+)["\']', content, re.IGNORECASE)
    for form_action in form_matches:
        # If it's a contact form submitting to web3forms, verify redirect
        if "web3forms.com" in form_action:
            redirect_match = re.search(r'<input\s+type=["\']hidden["\']\s+name=["\']redirect["\']\s+value=["\']([^"\']+)["\']', content, re.IGNORECASE)
            if not redirect_match:
                errors.append(f"[{file}] Form submits to Web3Forms but has no redirect URL.")
            else:
                redirect_url = redirect_match.group(1)
                expected_redirect = "grazie.html" if lang == "it" else "vielen-dank.html"
                if expected_redirect not in redirect_url:
                    errors.append(f"[{file}] Form redirect is '{redirect_url}', expected to contain '{expected_redirect}' for language '{lang}'.")
            
            # Check for Privacy Policy link matching form language
            privacy_link_match = re.search(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>Privacy Policy</a>', content, re.IGNORECASE)
            if privacy_link_match:
                privacy_link = privacy_link_match.group(1)
                expected_privacy = "privacy-policy.html" if lang == "it" else "privacy-policy-de.html"
                if privacy_link != expected_privacy:
                    errors.append(f"[{file}] GDPR form links to privacy policy '{privacy_link}', but expected '{expected_privacy}' for language '{lang}'.")

    # 6. Check WhatsApp Float Button Widget
    # Search for wa.me link
    wa_match = re.search(r'<a\s+[^>]*href=["\']https://wa.me/[^"\']+["\'][^>]*>', content, re.IGNORECASE)
    if wa_match:
        tag_content = wa_match.group(0)
        if 'target="_blank"' not in tag_content:
            errors.append(f"[{file}] WhatsApp float link missing target='_blank'.")
        if 'rel="noopener noreferrer"' not in tag_content and 'rel="noreferrer noopener"' not in tag_content:
            errors.append(f"[{file}] WhatsApp float link missing rel='noopener noreferrer'.")
        if 'gtag' not in tag_content and 'onclick' not in tag_content:
            errors.append(f"[{file}] WhatsApp float link missing onClick GA4 tracking event.")
            
        # Check text content inside whatsapp tag
        wa_full_tag = re.search(r'<a\s+[^>]*href=["\']https://wa.me/[^"\']+["\'][^>]*>(.*?)</a>', content, re.DOTALL | re.IGNORECASE)
        if wa_full_tag:
            inner_text = wa_full_tag.group(1).lower()
            if lang == "it" and "scrivici" not in inner_text:
                warnings.append(f"[{file}] WhatsApp text for IT page doesn't contain 'Scrivici' (got: '{inner_text.strip()}').")
            elif lang == "de" and "schreiben" not in inner_text and "kontakt" not in inner_text:
                warnings.append(f"[{file}] WhatsApp text for DE page doesn't contain 'Schreiben Sie uns' (got: '{inner_text.strip()}').")

# 7. Check Bidirectional Hreflang Alternates
print("\n=== Verifying Bidirectional Alternates ===")
for file, mapping in hreflang_mappings.items():
    for lang, url in mapping.items():
        # Get target filename from URL
        target_filename = url.split("idalbau.github.io/")[-1].split("#")[0]
        if not target_filename or target_filename == "":
            target_filename = "index.html"
            
        if target_filename not in html_files:
            errors.append(f"[{file}] Alternate URL '{url}' maps to non-existent local file '{target_filename}'.")
            continue
            
        # Check if target page maps back to this file
        target_mapping = hreflang_mappings.get(target_filename, {})
        source_lang = "it" if file in ["index.html", "chi-siamo.html", "portfolio.html", "ristrutturazione-bagno-merano.html", "impermeabilizzazioni-bolzano.html", "grazie.html", "impressum.html", "privacy-policy.html", "cookie-policy.html"] else "de"
        
        # Special check for root mapping (which defaults to IT)
        if file == "index.html":
            source_lang = "it"
            
        back_link = target_mapping.get(source_lang, "")
        back_filename = back_link.split("idalbau.github.io/")[-1].split("#")[0]
        if not back_filename or back_filename == "":
            back_filename = "index.html"
            
        if back_filename != file:
            errors.append(f"[{file}] Alternate mapping to '{target_filename}' is not bidirectional. '{target_filename}' alternates map back to '{back_filename}' instead of '{file}'.")

# 8. Check Sitemap.xml validity
sitemap_path = os.path.join(ROOT_DIR, "sitemap.xml")
if os.path.exists(sitemap_path):
    print("\n=== Auditing sitemap.xml ===")
    try:
        # Simple parse or regex to verify sitemap elements
        with open(sitemap_path, "r", encoding="utf-8") as sf:
            sitemap_content = sf.read()
            
        # Check if all 10 pages are included
        expected_pages_in_sitemap = [
            "index.html", "chi-siamo.html", "portfolio.html", "ristrutturazione-bagno-merano.html", "impermeabilizzazioni-bolzano.html",
            "index-de.html", "ueber-uns.html", "projektbeispiele.html", "badsanierung-meran.html", "abdichtungen-bozen.html"
        ]
        
        for p in expected_pages_in_sitemap:
            p_clean = "" if p == "index.html" else p
            if p_clean == "":
                if "https://idalbau.github.io/" not in sitemap_content:
                    errors.append(f"[sitemap.xml] Missing reference to root URL https://idalbau.github.io/.")
            else:
                if f"https://idalbau.github.io/{p}" not in sitemap_content:
                    errors.append(f"[sitemap.xml] Missing reference to page https://idalbau.github.io/{p}.")
                    
        # Check alternate links in sitemap.xml
        alternate_tags_count = sitemap_content.count("xhtml:link")
        print(f"  - Found {alternate_tags_count} alternate page links in sitemap.xml")
        if alternate_tags_count == 0:
            errors.append("[sitemap.xml] Missing xhtml:link alternate tags.")
            
    except Exception as e:
        errors.append(f"Failed to parse sitemap.xml: {str(e)}")
else:
    errors.append("Missing sitemap.xml in root directory!")

print("\n=== AUDIT RESULTS ===")
print(f"Total Errors found: {len(errors)}")
print(f"Total Warnings found: {len(warnings)}")

if errors:
    print("\nERRORS:")
    for err in errors:
        print(f"❌ {err}")

if warnings:
    print("\nWARNINGS:")
    for warn in warnings:
        print(f"⚠️ {warn}")

if not errors and not warnings:
    print("\n✅ All checks passed! No errors or warnings found. Excellent work!")
elif not errors:
    print("\n✅ No blocker errors found! Just minor warnings.")
