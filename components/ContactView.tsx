

import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import { View } from '../types.ts';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { MailIcon } from './icons/index.ts';

interface ContactViewProps {
    onNavigate: (view: View) => void;
}

const ContactView: React.FC<ContactViewProps> = ({ onNavigate }) => {
    const { user } = useContext(UserContext);
    const { t } = useTranslations();

    const otherSubjectIdentifier = 'other';
    
    // State for Contact Form
    const [contactSubject, setContactSubject] = useState(t('contact_subject_feedback'));
    const [otherSubjectText, setOtherSubjectText] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [contactEmail, setContactEmail] = useState(user?.email && user.email !== 'guest@learn-darija.com' ? user.email : '');

    const handleSendEmail = () => {
        const recipient = 'contact@learn-darija.com'; // Hardcoded recipient email
        const finalSubject = contactSubject === otherSubjectIdentifier ? otherSubjectText : contactSubject;
        const subject = encodeURIComponent(finalSubject);
        const body = encodeURIComponent(`From: ${contactEmail}\nUser UID: ${user?.uid || 'guest'}\n\nMessage:\n${contactMessage}`);
        window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    };

    const contactSubjects = [
        { label: t('contact_subject_feedback'), value: t('contact_subject_feedback') },
        { label: t('contact_subject_bug'), value: t('contact_subject_bug') },
        { label: t('contact_subject_question'), value: t('contact_subject_question') },
        { label: t('contact_subject_feature'), value: t('contact_subject_feature') },
        { label: t('contact_subject_partnership'), value: t('contact_subject_partnership') },
        { label: t('contact_subject_account'), value: t('contact_subject_account') },
        { label: t('contact_subject_other'), value: otherSubjectIdentifier },
    ];

    const isSendDisabled = !contactMessage.trim() || !contactEmail.trim() || (contactSubject === otherSubjectIdentifier && !otherSubjectText.trim());

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <MailIcon className="w-12 h-12 mx-auto text-primary-400 mb-4" />
                <h2 className="text-3xl font-bold text-white">{t('contact_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2">{t('contact_subtitle')}</p>
            </div>
            
            <Card>
                <div className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="contact-email" className="block text-sm font-medium text-slate-300 mb-1">{t('contact_email')}</label>
                            <input
                                id="contact-email"
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder={t('auth_email_placeholder')}
                                required
                                className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="contact-subject" className="block text-sm font-medium text-slate-300 mb-1">{t('contact_subject')}</label>
                            <select 
                                id="contact-subject"
                                value={contactSubject}
                                onChange={(e) => setContactSubject(e.target.value)}
                                className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                            >
                                {contactSubjects.map(sub => <option key={sub.value} value={sub.value}>{sub.label}</option>)}
                            </select>
                        </div>

                        {contactSubject === otherSubjectIdentifier && (
                             <div className="animate-fade-in">
                                <label htmlFor="other-subject" className="block text-sm font-medium text-slate-300 mb-1 sr-only">{t('contact_other_subject_placeholder')}</label>
                                <input
                                    id="other-subject"
                                    type="text"
                                    value={otherSubjectText}
                                    onChange={(e) => setOtherSubjectText(e.target.value)}
                                    placeholder={t('contact_other_subject_placeholder')}
                                    required
                                    className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="contact-message" className="block text-sm font-medium text-slate-300 mb-1">{t('contact_message')}</label>
                            <textarea
                                id="contact-message"
                                rows={5}
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                                placeholder={t('contact_message') + '...'}
                                className="w-full p-2 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                             <Button onClick={() => onNavigate('settings')} className="w-full justify-center bg-slate-600 hover:bg-slate-500">
                                {t('button_back_to_settings')}
                            </Button>
                            <Button onClick={handleSendEmail} disabled={isSendDisabled} className="w-full justify-center">
                                {t('contact_send')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ContactView;