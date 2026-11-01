import os
import zipfile
import re
from xml.sax.saxutils import escape

def generate_srs_docx(output_path):
    # XML templates for OpenXML DOCX
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>"""

    root_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>"""

    header_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Header"/>
      <w:jc w:val="right"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="18"/>
        <w:color w:val="6B7280"/>
      </w:rPr>
      <w:t>MultiCart – Multi-Vendor E-Commerce Shopping Website | IEEE SRS v1.0.0</w:t>
    </w:r>
  </w:p>
</w:hdr>"""

    footer_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Footer"/>
      <w:tabs>
        <w:tab w:val="right" w:pos="9360"/>
      </w:tabs>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="18"/>
        <w:color w:val="6B7280"/>
      </w:rPr>
      <w:t>B.Sc. Computer Science Final Year Project Documentation</w:t>
    </w:r>
    <w:r>
      <w:tab/>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="18"/>
        <w:color w:val="6B7280"/>
      </w:rPr>
      <w:t>Page </w:t>
    </w:r>
    <w:fldSimple w:instr="PAGE"/>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="18"/>
        <w:color w:val="6B7280"/>
      </w:rPr>
      <w:t> of </w:t>
    </w:r>
    <w:fldSimple w:instr="NUMPAGES"/>
  </w:p>
</w:ftr>"""

    styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="1F2937"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>

  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr>
      <w:spacing w:before="360" w:after="160"/>
      <w:jc w:val="left"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:sz w:val="32"/>
      <w:color w:val="1E3A8A"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr>
      <w:spacing w:before="240" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:sz w:val="26"/>
      <w:color w:val="2563EB"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:pPr>
      <w:spacing w:before="180" w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:sz w:val="22"/>
      <w:color w:val="374151"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:pPr>
      <w:spacing w:before="480" w:after="200"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:sz w:val="48"/>
      <w:color w:val="1E3A8A"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:pPr>
      <w:spacing w:before="0" w:after="400"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="28"/>
      <w:color w:val="4B5563"/>
    </w:rPr>
  </w:style>
</w:styles>"""

    # Read markdown content
    with open('docs/SRS.md', 'r', encoding='utf-8') as f:
        md_text = f.read()

    # Parse markdown into DOCX elements
    body_elements = []

    # Title / Metadata Banner
    body_elements.append("""
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/></w:pPr>
      <w:r><w:t>MultiCart – Multi-Vendor E-Commerce Platform</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Subtitle"/></w:pPr>
      <w:r><w:t>Software Requirements Specification (SRS) Document</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="300"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="1E3A8A"/></w:rPr><w:t>Bachelor of Science in Computer Science (B.Sc. CS) Final Year Capstone Project</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="400"/></w:pPr>
      <w:r><w:rPr><w:i/><w:color w:val="6B7280"/></w:rPr><w:t>Compliant with IEEE Std 830-1998 &amp; ISO/IEC/IEEE 29148:2018 | Version 1.0.0 (Baseline)</w:t></w:r>
    </w:p>
    """)

    lines = md_text.split('\n')
    i = 0
    in_code_block = False
    code_lines = []
    in_table = False
    table_rows = []

    def make_run(text, bold=False, italic=False, code=False, color=None):
        props = []
        if bold: props.append("<w:b/>")
        if italic: props.append("<w:i/>")
        if code: props.append('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:color w:val="C026D3"/>')
        elif color: props.append(f'<w:color w:val="{color}"/>')
        
        pr_str = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
        return f"<w:r>{pr_str}<w:t xml:space=\"preserve\">{escape(text)}</w:t></w:r>"

    def format_inline_text(text):
        # Parses markdown bold, italic, inline code
        tokens = re.split(r'(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)', text)
        runs = []
        for token in tokens:
            if not token:
                continue
            if token.startswith('`') and token.endswith('`'):
                runs.append(make_run(token[1:-1], code=True))
            elif token.startswith('**') and token.endswith('**'):
                runs.append(make_run(token[2:-2], bold=True))
            elif token.startswith('*') and token.endswith('*'):
                runs.append(make_run(token[1:-1], italic=True))
            else:
                runs.append(make_run(token))
        return "".join(runs)

    def render_table(rows):
        if not rows:
            return ""
        xml = ['<w:tbl>',
               '<w:tblPr>',
               '  <w:tblW w:w="9360" w:type="dxa"/>',
               '  <w:tblBorders>',
               '    <w:top w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>',
               '    <w:left w:val="none"/>',
               '    <w:bottom w:val="single" w:sz="6" w:space="0" w:color="9CA3AF"/>',
               '    <w:right w:val="none"/>',
               '    <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>',
               '    <w:insideV w:val="none"/>',
               '  </w:tblBorders>',
               '  <w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tblCellMar>',
               '</w:tblPr>']
        
        is_header = True
        for row in rows:
            cols = [c.strip() for c in row.strip('|').split('|')]
            xml.append('<w:tr>')
            for col in cols:
                bg = '<w:shd w:val="clear" w:color="auto" w:fill="1E3A8A"/>' if is_header else ''
                text_xml = ""
                if is_header:
                    text_xml = f'<w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>{escape(col)}</w:t></w:r>'
                else:
                    text_xml = format_inline_text(col)
                
                xml.append(f'''<w:tc>
                  <w:tcPr>{bg}</w:tcPr>
                  <w:p><w:pPr><w:spacing w:after="40" w:before="40"/></w:pPr>{text_xml}</w:p>
                </w:tc>''')
            xml.append('</w:tr>')
            is_header = False
        xml.append('</w:tbl>')
        xml.append('<w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>')
        return "\n".join(xml)

    while i < len(lines):
        line = lines[i]
        
        # Skip top markdown header block as we already injected a cover banner
        if i < 15 and (line.startswith('# ') or line.startswith('## ') or line.startswith('**Project Title:') or line.startswith('---')):
            i += 1
            continue

        # Code block handler
        if line.strip().startswith('```'):
            if in_code_block:
                in_code_block = False
                code_text = "\n".join(code_lines)
                code_lines = []
                # Render code callout block
                box_xml = f"""
                <w:tbl>
                  <w:tblPr>
                    <w:tblW w:w="9360" w:type="dxa"/>
                    <w:tblBorders>
                      <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
                      <w:left w:val="single" w:sz="18" w:space="0" w:color="2563EB"/>
                      <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
                      <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
                    </w:tblBorders>
                    <w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="180" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tblCellMar>
                  </w:tblPr>
                  <w:tr>
                    <w:tc>
                      <w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/></w:tcPr>
                      {"".join([f'<w:p><w:pPr><w:spacing w:after="40" w:before="0"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">{escape(cl)}</w:t></w:r></w:p>' for cl in code_text.splitlines()])}
                    </w:tc>
                  </w:tr>
                </w:tbl>
                <w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>
                """
                body_elements.append(box_xml)
            else:
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # Optional layout marker used to keep an implementation appendix section together.
        if line.strip().lower() == '<!-- page-break -->':
            body_elements.append('<w:p><w:r><w:br w:type="page"/></w:r></w:p>')
            i += 1
            continue

        # Markdown tables
        if line.strip().startswith('|') and '|' in line.strip()[1:]:
            # check if delimiter row
            if re.match(r'\|[\s:-]+\|', line.strip()):
                i += 1
                continue
            if not in_table:
                in_table = True
                table_rows = [line]
            else:
                table_rows.append(line)
            i += 1
            continue
        else:
            if in_table:
                in_table = False
                body_elements.append(render_table(table_rows))
                table_rows = []

        # Headings
        if line.startswith('# '):
            body_elements.append(f'<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>{format_inline_text(line[2:].strip())}</w:p>')
        elif line.startswith('## '):
            body_elements.append(f'<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>{format_inline_text(line[3:].strip())}</w:p>')
        elif line.startswith('### '):
            body_elements.append(f'<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr>{format_inline_text(line[4:].strip())}</w:p>')
        elif line.startswith('#### '):
            body_elements.append(f'<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr>{format_inline_text(line[5:].strip())}</w:p>')
        elif line.strip() == '---':
            body_elements.append('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="E2E8F0"/></w:pBdr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>')
        elif line.strip().startswith('- ') or line.strip().startswith('* '):
            body_text = line.strip()[2:]
            body_elements.append(f'<w:p><w:pPr><w:ind w:left="400"/><w:spacing w:after="80"/></w:pPr><w:r><w:t xml:space="preserve">•  </w:t></w:r>{format_inline_text(body_text)}</w:p>')
        elif re.match(r'^\d+\.\s+', line.strip()):
            m = re.match(r'^(\d+\.)\s+(.*)', line.strip())
            num_prefix = m.group(1)
            body_text = m.group(2)
            body_elements.append(f'<w:p><w:pPr><w:ind w:left="400"/><w:spacing w:after="80"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">{num_prefix}  </w:t></w:r>{format_inline_text(body_text)}</w:p>')
        elif line.strip():
            body_elements.append(f'<w:p><w:pPr><w:spacing w:after="140"/></w:pPr>{format_inline_text(line)}</w:p>')
        else:
            # blank line
            pass
        
        i += 1

    if in_table and table_rows:
        body_elements.append(render_table(table_rows))

    document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {"".join(body_elements)}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId2" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
      <w:footerReference w:type="default" r:id="rId3" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>"""

    # Assemble docx zip
    with zipfile.ZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED) as docx:
        docx.writestr('[Content_Types].xml', content_types)
        docx.writestr('_rels/.rels', root_rels)
        docx.writestr('word/_rels/document.xml.rels', doc_rels)
        docx.writestr('word/styles.xml', styles_xml)
        docx.writestr('word/header1.xml', header_xml)
        docx.writestr('word/footer1.xml', footer_xml)
        docx.writestr('word/document.xml', document_xml)

    print(f"Successfully generated DOCX at {output_path}")

if __name__ == '__main__':
    generate_srs_docx('docs/SRS.docx')
