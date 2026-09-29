-- ==============================================================================
-- Seed Standard Document Templates for Kenyan Public Procurement
-- ==============================================================================

INSERT INTO document_templates (id, name, doc_type, template_content, is_fixed_format)
VALUES
(
  'a1111111-1111-1111-1111-111111111111',
  'Kenyan Standard Technical Proposal Template',
  'technical_proposal',
  '# TECHNICAL PROPOSAL FOR {{tender_title}}
**Tender Reference:** {{external_reference}}  
**Procuring Entity:** {{procuring_entity}}  
**Bidder:** {{company_name}} (AGPO Category: {{agpo_category}})  
**Date of Submission:** {{submission_deadline}}  

---

## 1. Executive Summary & Understanding of the Assignment
{{company_name}} is pleased to submit this Technical Proposal in response to Tender Ref **{{external_reference}}** for the **{{tender_title}}**. Having thoroughly examined the tender documents, we present our technical methodology designed to deliver robust, scalable, and secure digital infrastructure adhering to Kenyan e-Government interoperability standards.

## 2. Technical Approach, Architecture & Methodology
### 2.1 Solution Architecture
Our proposed architecture adopts modular, containerized micro-services with enterprise PostgreSQL data persistence and responsive web/mobile interfaces.
- **Frontend Layer:** Responsive Web Application with WCAG accessibility compliance.
- **API & Integration Gateway:** RESTful services with JSON payloads, OAuth2 authentication, and KRA/IFMIS interface readiness.
- **Security & Data Protection:** Full compliance with the Kenya Data Protection Act, 2019, including TLS 1.3 encryption in transit and AES-256 encryption at rest.

### 2.2 Workplan & Key Deliverables
- **Phase 1 (Weeks 1–3):** Inception, Requirements Gathering & System Architecture Design
- **Phase 2 (Weeks 4–8):** Core Engineering, Integration & Iterative Sprints
- **Phase 3 (Weeks 9–11):** Quality Assurance, User Acceptance Testing (UAT) & Security Audit
- **Phase 4 (Weeks 12+):** Commissioning, Staff Training & Handover with 12 Months Warranty

## 3. Firm Experience & Specific Similar Assignments
{{past_projects_section}}

## 4. Key Technical Personnel & Qualifications
{{key_personnel_section}}

## 5. Support, SLA & Knowledge Transfer
Comprehensive warranty for 12 months post-commissioning, 24/7 Level-1 helpdesk support, and structured technical knowledge transfer for client IT staff.',
  false
),
(
  'b2222222-2222-2222-2222-222222222222',
  'Standard Financial Proposal & Bill of Quantities',
  'financial_proposal',
  '# FINANCIAL PROPOSAL & PRICE SCHEDULE
**Tender Reference:** {{external_reference}}  
**Procuring Entity:** {{procuring_entity}}  
**Bidder:** {{company_name}}  
**Currency:** Kenya Shillings (KES)  

---

## 1. Price Breakdown Schedule
| Item | Description | Quantity | Unit Price (KES) | Total Amount (KES) |
|---|---|---|---|---|
| 1.0 | Software Design & Architecture Inception | 1 Lot | {{price_design}} | {{price_design}} |
| 2.0 | Core Engineering & Custom Application Development | 1 Lot | {{price_dev}} | {{price_dev}} |
| 3.0 | Cloud Setup, API Gateway & Security Hardening | 1 Lot | {{price_cloud}} | {{price_cloud}} |
| 4.0 | User Training, Documentation & Handover | 1 Lot | {{price_training}} | {{price_training}} |
| 5.0 | 12-Month Maintenance & SLA Support | 12 Months | {{price_support}} | {{price_support}} |

**Sub-Total:** KES {{subtotal_price}}  
**16% V.A.T.:** KES {{vat_amount}}  
**GRAND TOTAL (Inclusive of all Applicable Taxes):** KES {{grand_total_price}}  

*Note: All prices are firm and fixed for the 120-day tender validity period.*',
  false
),
(
  'c3333333-3333-3333-3333-333333333333',
  'Bid Transmittal & Tender Submission Cover Letter',
  'cover_letter',
  '**{{company_name}}**  
{{physical_address}} | {{postal_address}}  
Email: {{contact_email}} | Tel: {{contact_phone}}  
KRA PIN: {{kra_pin}} | AGPO Cert: {{agpo_cert_number}}  

**Date:** {{current_date}}  

To:  
The Accounting Officer / Head of Supply Chain Management  
**{{procuring_entity}}**  

Dear Sir / Madam,

### RE: SUBMISSION OF TENDER FOR {{tender_title}} (TENDER REF: {{external_reference}})

Having examined the tender documents, including Addenda, we, the undersigned, offer to supply, deliver, install, test, and commission the **{{tender_title}}** in accordance with the Conditions of Contract, Technical Specifications, and Bills of Quantities.

We confirm that:
1. {{company_name}} is an active Kenyan enterprise duly incorporated under the Companies Act and certified under the National Treasury **AGPO ({{agpo_category}})** program.
2. We have attached all mandatory statutory compliance certificates, including valid KRA Tax Compliance, CR12, Business Permit, and Bank References.
3. Our tender shall remain valid for a period of **120 days** from the date of tender opening.
4. If our bid is accepted, we undertake to furnish the required Performance Security and commence work immediately upon signing the contract.

Yours faithfully,  

_____________________________  
**Managing Director / Authorized Signatory**  
For and on behalf of **{{company_name}}**',
  false
),
(
  'd4444444-4444-4444-4444-444444444444',
  'Statutory Form of Tender (PPRA Fixed Format)',
  'form_of_tender',
  '# FORM OF TENDER
*(To be completed by Bidder on Official Letterhead without alteration to text)*

**TENDER NO:** {{external_reference}}  
**TO:** {{procuring_entity}}  

1. In accordance with the Conditions of Contract, Specifications, and Bills of Quantities for the execution of the above named Works, we, the undersigned offer to construct, install and complete such Works and remedy any defects therein for the sum of:
**KES: {{grand_total_price}}**  
*(Amount in Words: Kenya Shillings {{grand_total_words}} only)*.

2. We undertake, if our tender is accepted, to commence the Works as soon as is reasonably possible after the receipt of the Engineer’s notice to commence, and to complete the whole of the Works comprised in the Contract within the time stated in the Appendix to Conditions of Contract.

3. We agree to abide by this Tender for the period of 120 days from the date fixed for tender opening and it shall remain binding upon us and may be accepted at any time before that period.

4. Unless and until a formal Agreement is prepared and executed this Tender together with your written acceptance thereof shall constitute a binding Contract between us.

Dated this _______ day of _________________ 2026.  
Signature: _________________________________________  
in the capacity of _________________________________  
duly authorized to sign tenders for and on behalf of:  
**{{company_name}}**  
Address: {{physical_address}}, {{postal_address}}',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  template_content = EXCLUDED.template_content,
  is_fixed_format = EXCLUDED.is_fixed_format;
