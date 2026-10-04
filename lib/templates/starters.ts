/**
 * Built-in starter templates, available to every account as read-only
 * starting points. Editing one saves a copy to the user's own templates.
 *
 * Each body uses the agreement format from lib/pdf/agreement.ts; every
 * {{placeholder}} matches a field label below (and vice versa).
 */
import type { FieldType, TemplateDetail, TemplateField } from '@/types/workflows';

const NOT_LEGAL_ADVICE = 'A starting point, not legal advice — review it for your situation.';

type StarterSpec = Pick<TemplateDetail, 'id' | 'name' | 'category' | 'estimatedMinutes' | 'description'> & {
  fields: [FieldType, string, string][];
  body: string;
};

const SPECS: StarterSpec[] = [
  {
    id: 'starter-nda',
    name: 'Mutual NDA',
    category: 'Legal',
    estimatedMinutes: 3,
    description: 'Two-way confidentiality agreement for early conversations with partners or vendors.',
    fields: [
      ['name', 'Sender full name', 'Sender'],
      ['text', 'Sender company', 'Sender'],
      ['name', 'Client full name', 'Client'],
      ['text', 'Client company', 'Client'],
      ['date', 'Effective date', 'Sender'],
      ['text', 'Purpose', 'Sender'],
      ['text', 'Confidentiality period', 'Sender'],
      ['text', 'Governing law', 'Sender'],
      ['signature', 'Sender signature', 'Sender'],
      ['date', 'Sender date', 'Sender'],
      ['signature', 'Client signature', 'Client'],
      ['date', 'Client date', 'Client'],
    ],
    body: `This Mutual Non-Disclosure Agreement (the "Agreement") is made on {{Effective date}} between {{Sender company}}, represented by {{Sender full name}}, and {{Client company}}, represented by {{Client full name}} (each a "Party" and together the "Parties").

## 1. Purpose
The Parties wish to share information with each other for the following purpose: {{Purpose}} (the "Purpose"). This Agreement protects that information.

## 2. Confidential information
"Confidential Information" means any non-public business, technical, financial or personal information disclosed by one Party to the other, in any form, that is marked confidential or that a reasonable person would understand to be confidential.

It does not include information that is or becomes public through no fault of the receiving Party, was already lawfully known to the receiving Party, is independently developed without use of the other Party's information, or is lawfully received from a third party without restriction.

## 3. Obligations
Each Party will use the other Party's Confidential Information only for the Purpose, will protect it with at least the same care it uses for its own confidential information (and no less than reasonable care), and will share it only with employees and advisers who need to know it and are bound by similar duties of confidentiality.

If a Party is required by law to disclose Confidential Information, it will, where legally permitted, give the other Party prompt notice and disclose only what is required.

## 4. Term
These obligations last for {{Confidentiality period}} from the Effective Date. On request, each Party will return or destroy the other Party's Confidential Information, except copies it must keep by law.

## 5. General
No licence or ownership rights are granted by this Agreement. Nothing obliges either Party to enter into any further transaction. This Agreement is governed by the laws of {{Governing law}}. It is the entire agreement on this subject and may only be changed in writing signed by both Parties.

## Signatures
{{Sender company}}: {{Sender signature}}  Date: {{Sender date}}

{{Client company}}: {{Client signature}}  Date: {{Client date}}`,
  },
  {
    id: 'starter-services',
    name: 'Service Agreement',
    category: 'Services',
    estimatedMinutes: 5,
    description: 'Scope, fees and payment terms for a client engagement.',
    fields: [
      ['text', 'Sender company', 'Sender'],
      ['name', 'Sender full name', 'Sender'],
      ['text', 'Client company', 'Client'],
      ['name', 'Client full name', 'Client'],
      ['date', 'Effective date', 'Sender'],
      ['text', 'Project scope', 'Sender'],
      ['text', 'Fees', 'Sender'],
      ['text', 'Payment terms', 'Sender'],
      ['text', 'Governing law', 'Sender'],
      ['initials', 'Client initials', 'Client'],
      ['signature', 'Sender signature', 'Sender'],
      ['date', 'Sender date', 'Sender'],
      ['signature', 'Client signature', 'Client'],
      ['date', 'Client date', 'Client'],
    ],
    body: `This Service Agreement (the "Agreement") starts on {{Effective date}} and is between {{Sender company}} (the "Provider"), represented by {{Sender full name}}, and {{Client company}} (the "Client"), represented by {{Client full name}}.

## 1. Services
The Provider will perform the following services (the "Services"): {{Project scope}}. Any change to the Services must be agreed in writing by both parties, including any change to fees or timelines.

## 2. Fees and payment
The Client will pay the Provider {{Fees}} for the Services. Payment terms: {{Payment terms}}. Invoices are payable in full by the due date shown on the invoice. Late payments may delay ongoing work.

## 3. Responsibilities
The Provider will perform the Services with reasonable skill and care. The Client will provide timely information, access and feedback reasonably needed for the Provider to deliver the Services.

## 4. Intellectual property
On full payment, the Client owns the final deliverables created specifically for it under this Agreement. The Provider keeps ownership of its pre-existing materials, tools and know-how, and grants the Client a licence to use them as part of the deliverables.

## 5. Confidentiality
Each party will keep the other's non-public information confidential and use it only to perform this Agreement.

## 6. Term and termination
This Agreement continues until the Services are completed. Either party may end it with 14 days' written notice, or immediately if the other party materially breaches it and does not fix the breach within 14 days of notice. The Client will pay for Services performed up to the end date.

## 7. Liability
Except for unpaid fees or breach of confidentiality, each party's total liability under this Agreement is limited to the fees paid or payable under it.

## 8. General
This Agreement is governed by the laws of {{Governing law}}. It is the entire agreement between the parties on this subject.

Client acknowledges the terms above: {{Client initials}}

## Signatures
Provider: {{Sender signature}}  Date: {{Sender date}}

Client: {{Client signature}}  Date: {{Client date}}`,
  },
  {
    id: 'starter-employment',
    name: 'Employment Contract',
    category: 'HR',
    estimatedMinutes: 6,
    description: 'Role, compensation and start date for a new hire.',
    fields: [
      ['text', 'Employer company', 'Sender'],
      ['name', 'Employer representative', 'Sender'],
      ['name', 'Employee full name', 'Client'],
      ['text', 'Job title', 'Sender'],
      ['date', 'Start date', 'Sender'],
      ['text', 'Work location', 'Sender'],
      ['text', 'Salary', 'Sender'],
      ['text', 'Pay frequency', 'Sender'],
      ['text', 'Working hours', 'Sender'],
      ['text', 'Annual leave', 'Sender'],
      ['text', 'Notice period', 'Sender'],
      ['text', 'Governing law', 'Sender'],
      ['initials', 'Employee initials', 'Client'],
      ['signature', 'Employer signature', 'Sender'],
      ['signature', 'Employee signature', 'Client'],
      ['date', 'Date signed', 'Client'],
    ],
    body: `This Employment Contract is between {{Employer company}} (the "Employer") and {{Employee full name}} (the "Employee").

## 1. Position and start date
The Employee will work as {{Job title}}, starting on {{Start date}}, based at {{Work location}}. The Employee will perform the duties reasonably assigned for this role.

## 2. Compensation
The Employer will pay the Employee a salary of {{Salary}}, paid {{Pay frequency}}, less any deductions required by law. Salary will be reviewed periodically.

## 3. Working hours and leave
Normal working hours are {{Working hours}}. The Employee is entitled to {{Annual leave}} of paid annual leave per year, plus public holidays, in line with company policy and applicable law.

## 4. Policies and conduct
The Employee agrees to follow the Employer's reasonable policies and procedures, as updated from time to time, and to act honestly and in the Employer's best interests.

## 5. Confidentiality and work product
During and after employment, the Employee will keep the Employer's confidential information private. Work created by the Employee in the course of employment belongs to the Employer, to the extent permitted by law.

## 6. Termination
After any probation period, either party may end this contract by giving {{Notice period}} written notice. The Employer may end employment immediately for serious misconduct, as permitted by law.

## 7. General
This contract is governed by the laws of {{Governing law}}. It replaces any earlier discussions about employment terms. Changes must be agreed in writing.

Employee confirms they have read the company policies: {{Employee initials}}

## Signatures
For the Employer, {{Employer representative}}: {{Employer signature}}

Employee: {{Employee signature}}  Date: {{Date signed}}`,
  },
  {
    id: 'starter-lease',
    name: 'Residential Lease',
    category: 'Real estate',
    estimatedMinutes: 8,
    description: 'Rental terms between a landlord and tenant.',
    fields: [
      ['name', 'Landlord full name', 'Sender'],
      ['name', 'Tenant full name', 'Client'],
      ['text', 'Property address', 'Sender'],
      ['date', 'Lease start', 'Sender'],
      ['date', 'Lease end', 'Sender'],
      ['text', 'Rent amount', 'Sender'],
      ['text', 'Rent due day', 'Sender'],
      ['text', 'Security deposit', 'Sender'],
      ['checkbox', 'Pets allowed', 'Sender'],
      ['text', 'Governing law', 'Sender'],
      ['initials', 'Tenant initials', 'Client'],
      ['signature', 'Landlord signature', 'Sender'],
      ['signature', 'Tenant signature', 'Client'],
      ['date', 'Date signed', 'Client'],
    ],
    body: `This Residential Lease is between {{Landlord full name}} (the "Landlord") and {{Tenant full name}} (the "Tenant") for the property at {{Property address}} (the "Property").

## 1. Term
The lease starts on {{Lease start}} and ends on {{Lease end}}, unless renewed or ended earlier under this lease or applicable law.

## 2. Rent
The Tenant will pay rent of {{Rent amount}}, due on {{Rent due day}} of each period, by the payment method the Landlord reasonably specifies.

## 3. Security deposit
The Tenant will pay a security deposit of {{Security deposit}} before moving in. The Landlord will return it, less any lawful deductions for unpaid rent or damage beyond normal wear and tear, within the time required by law after the lease ends.

## 4. Use of the property
The Property is for residential use by the Tenant and their household only. The Tenant will not sublet without the Landlord's written consent. Pets allowed: {{Pets allowed}}.

## 5. Repairs and maintenance
The Tenant will keep the Property clean and report any damage or needed repairs promptly. The Landlord will keep the structure and essential services in good repair and will give reasonable notice before entering, except in emergencies.

## 6. Ending the lease
At the end of the lease the Tenant will return the Property and all keys in the same condition as at the start, apart from normal wear and tear.

## 7. General
This lease is governed by the laws of {{Governing law}}. If any part is unenforceable, the rest remains in effect.

Tenant confirms they have read the house rules: {{Tenant initials}}

## Signatures
Landlord: {{Landlord signature}}

Tenant: {{Tenant signature}}  Date: {{Date signed}}`,
  },
  {
    id: 'starter-sales',
    name: 'Sales Contract',
    category: 'Sales',
    estimatedMinutes: 4,
    description: 'Goods, price and delivery terms for a sale.',
    fields: [
      ['text', 'Seller company', 'Sender'],
      ['text', 'Buyer company', 'Client'],
      ['name', 'Buyer full name', 'Client'],
      ['text', 'Items sold', 'Sender'],
      ['text', 'Purchase price', 'Sender'],
      ['text', 'Payment terms', 'Sender'],
      ['date', 'Delivery date', 'Sender'],
      ['text', 'Delivery address', 'Client'],
      ['text', 'Governing law', 'Sender'],
      ['signature', 'Seller signature', 'Sender'],
      ['signature', 'Buyer signature', 'Client'],
      ['date', 'Date signed', 'Client'],
    ],
    body: `This Sales Contract is between {{Seller company}} (the "Seller") and {{Buyer company}} (the "Buyer"), represented by {{Buyer full name}}.

## 1. Goods
The Seller agrees to sell and the Buyer agrees to buy the following goods (the "Goods"): {{Items sold}}.

## 2. Price and payment
The total purchase price is {{Purchase price}}. Payment terms: {{Payment terms}}. Ownership of the Goods passes to the Buyer once the purchase price has been paid in full.

## 3. Delivery
The Seller will deliver the Goods to {{Delivery address}} on or before {{Delivery date}}. Risk of loss passes to the Buyer on delivery.

## 4. Inspection
The Buyer will inspect the Goods on delivery and notify the Seller in writing of any defect or shortfall within 7 days. The Seller will repair, replace or refund defective Goods.

## 5. Warranty
The Seller confirms it has the right to sell the Goods and that they match the description above. Other warranties are excluded to the extent permitted by law.

## 6. General
This contract is governed by the laws of {{Governing law}}. It is the entire agreement for this sale and may only be changed in writing signed by both parties.

## Signatures
Seller: {{Seller signature}}

Buyer: {{Buyer signature}}  Date: {{Date signed}}`,
  },
  {
    id: 'starter-offer',
    name: 'Offer Letter',
    category: 'HR',
    estimatedMinutes: 3,
    description: 'Formal job offer with salary and start date.',
    fields: [
      ['text', 'Company name', 'Sender'],
      ['name', 'Candidate full name', 'Client'],
      ['text', 'Job title', 'Sender'],
      ['date', 'Start date', 'Sender'],
      ['text', 'Salary', 'Sender'],
      ['text', 'Reporting manager', 'Sender'],
      ['date', 'Offer expiry date', 'Sender'],
      ['name', 'Hiring manager name', 'Sender'],
      ['signature', 'Hiring manager signature', 'Sender'],
      ['signature', 'Candidate signature', 'Client'],
      ['date', 'Date accepted', 'Client'],
    ],
    body: `Dear {{Candidate full name}},

We are delighted to offer you the position of {{Job title}} at {{Company name}}.

## Role and start date
Your start date will be {{Start date}}, and you will report to {{Reporting manager}}.

## Compensation
Your starting salary will be {{Salary}}, paid in line with the company's normal payroll schedule and subject to applicable deductions. You will also be eligible for the benefits offered to employees in similar roles.

## Conditions
This offer is subject to satisfactory references and any checks required for the role. Full terms of employment will be set out in your employment contract.

## Accepting this offer
To accept, please sign below by {{Offer expiry date}}. After that date this offer will lapse unless we agree otherwise in writing.

We look forward to welcoming you to the team.

Kind regards,

{{Hiring manager name}}, {{Company name}}: {{Hiring manager signature}}

## Acceptance
I accept this offer on the terms above.

Signed: {{Candidate signature}}  Date: {{Date accepted}}`,
  },
];

export const STARTER_TEMPLATES: TemplateDetail[] = SPECS.map(({ fields, description, ...spec }) => {
  const templateFields: TemplateField[] = fields.map(([type, label, role], i) => ({
    id: `${spec.id}-f${i}`,
    type,
    label,
    role,
    required: type !== 'checkbox',
  }));
  return {
    ...spec,
    description: `${description} ${NOT_LEGAL_ADVICE}`,
    roles: ['Sender', 'Client'],
    fields: templateFields,
    fieldCount: templateFields.length,
    usageCount: 0,
    builtIn: true,
    updatedAt: 0,
  };
});

export const isStarterTemplate = (id: string) => id.startsWith('starter-');
