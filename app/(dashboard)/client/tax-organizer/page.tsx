'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TAX_ORGANIZER_SECTIONS } from '@/lib/constants';
import { useState } from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

export default function ClientTaxOrganizerPage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const sections = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      fields: [
        { key: 'firstName', label: 'First Name', type: 'text', required: true },
        { key: 'lastName', label: 'Last Name', type: 'text', required: true },
        { key: 'ssn', label: 'Social Security Number', type: 'text', required: true, placeholder: 'XXX-XX-XXXX' },
        { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
        { key: 'filingStatus', label: 'Filing Status', type: 'select', required: true, options: ['Single', 'Married Filing Jointly', 'Married Filing Separately', 'Head of Household', 'Qualifying Widow'] },
      ],
    },
    {
      id: 'income',
      title: 'Income',
      fields: [
        { key: 'w2Income', label: 'W-2 Wages', type: 'number', required: false, placeholder: '$0.00' },
        { key: 'interestIncome', label: 'Interest Income', type: 'number', required: false, placeholder: '$0.00' },
        { key: 'dividendIncome', label: 'Dividend Income', type: 'number', required: false, placeholder: '$0.00' },
        { key: 'capitalGains', label: 'Capital Gains/Losses', type: 'number', required: false, placeholder: '$0.00' },
        { key: 'otherIncome', label: 'Other Income', type: 'textarea', required: false, placeholder: 'Describe any other income sources' },
      ],
    },
    {
      id: 'deductions',
      title: 'Deductions',
      fields: [
        { key: 'mortgageInterest', label: 'Mortgage Interest Paid', type: 'number', required: false, placeholder: '$0.00' },
        { key: 'propertyTaxes', label: 'State & Local Property Taxes', type: 'number', required: false, placeholder: '$0.00' },
        { key: 'charityDonations', label: 'Charitable Donations', type: 'number', required: false, placeholder: '$0.00' },
        { key: 'medicalExpenses', label: 'Medical Expenses', type: 'number', required: false, placeholder: '$0.00' },
        { key: 'studentLoanInterest', label: 'Student Loan Interest', type: 'number', required: false, placeholder: '$0.00' },
      ],
    },
    {
      id: 'investments',
      title: 'Investments & Assets',
      fields: [
        { key: 'stockSales', label: 'Stock Sales (gains/losses)', type: 'textarea', required: false, placeholder: 'List any stock sales with purchase and sale prices' },
        { key: 'realEstate', label: 'Real Estate Transactions', type: 'textarea', required: false, placeholder: 'Any property sales or purchases' },
        { key: 'cryptoTransactions', label: 'Crypto Transactions', type: 'textarea', required: false, placeholder: 'Any crypto sales or trades' },
      ],
    },
    {
      id: 'business',
      title: 'Business Information',
      fields: [
        { key: 'businessIncome', label: 'Self-Employment Income', type: 'number', required: false, placeholder: '$0.00' },
        { key: 'businessExpenses', label: 'Business Expenses', type: 'number', required: false, placeholder: '$0.00' },
        { key: 'businessDescription', label: 'Type of Business', type: 'text', required: false, placeholder: 'Describe your business' },
      ],
    },
    {
      id: 'credits',
      title: 'Tax Credits',
      fields: [
        { key: 'childTaxCredit', label: 'Number of Dependent Children', type: 'number', required: false },
        { key: 'educationCredit', label: 'Education Expenses', type: 'number', required: false, placeholder: '$0.00' },
        { key: 'earnedIncomeCredit', label: 'Earned Income Credit Eligible', type: 'checkbox', required: false },
      ],
    },
  ];

  const section = sections[currentSection];

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tax Organizer</h1>
        <p className="text-muted-foreground mt-1">Complete this questionnaire to help us prepare your tax return</p>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {sections.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSection(idx)}
            className={`flex-1 h-2 rounded-full transition-all ${
              idx <= currentSection ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{section.title}</CardTitle>
          <CardDescription>Section {currentSection + 1} of {sections.length}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium text-foreground">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </label>

                {field.type === 'text' && (
                  <Input
                    type="text"
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="mt-1"
                  />
                )}

                {field.type === 'date' && (
                  <Input
                    type="date"
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="mt-1"
                  />
                )}

                {field.type === 'number' && (
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="mt-1"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value="">Select an option</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {field.type === 'textarea' && (
                  <Textarea
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="mt-1"
                  />
                )}

                {field.type === 'checkbox' && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData[field.key] || false}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">Yes, I am eligible</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-4 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentSection === 0}
              className="flex-1"
            >
              Previous
            </Button>
            {currentSection === sections.length - 1 ? (
              <Button
                className="flex-1 bg-primary text-primary-foreground"
                onClick={handleSubmit}
              >
                Submit & Save
              </Button>
            ) : (
              <Button
                className="flex-1 bg-primary text-primary-foreground gap-2"
                onClick={handleNext}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sections List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">All Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sections.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSection(idx)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  idx === currentSection
                    ? 'bg-primary/10 border border-primary'
                    : 'hover:bg-muted'
                }`}
              >
                <div className={`flex-shrink-0 ${idx < currentSection ? 'text-accent' : 'text-muted-foreground'}`}>
                  {idx < currentSection ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${idx === currentSection ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {idx + 1}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">{s.title}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
