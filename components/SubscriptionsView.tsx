

import React from 'react';
import Card from './common/Card.tsx';
import Button from './common/Button.tsx';
import { useTranslations } from '../hooks/useTranslations.ts';
import { CheckCircleIcon, StarIcon } from './icons/index.ts';
import { TranslationKey } from '../localization/translations.ts';

interface TierFeatureProps {
    textKey: TranslationKey;
}

const TierFeature: React.FC<TierFeatureProps> = ({ textKey }) => {
    const { t } = useTranslations();
    return (
        <li className="flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">{t(textKey)}</span>
        </li>
    );
};

interface SubscriptionTierProps {
    nameKey: TranslationKey;
    priceKey: TranslationKey;
    features: TranslationKey[];
    isCurrent?: boolean;
    isPopular?: boolean;
}

const SubscriptionTier: React.FC<SubscriptionTierProps> = ({ nameKey, priceKey, features, isCurrent, isPopular }) => {
    const { t } = useTranslations();
    return (
        <Card className={`p-8 flex flex-col relative transition-transform transform hover:scale-105 duration-300
            ${isPopular 
                ? 'border-primary-400/80 ring-2 ring-primary-400/50 bg-gradient-to-br from-slate-800 to-primary-900/40' 
                : 'border-slate-700'
            }`}>
            {isPopular && (
                 <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                    <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg border-2 border-slate-800">
                        {t('subscriptions_most_popular')}
                    </div>
                </div>
            )}
            <div className="text-center">
                <h3 className="text-2xl font-bold text-white mt-2">{t(nameKey)}</h3>
                <p className="text-4xl font-extrabold text-primary-300 my-4">{t(priceKey)}</p>
            </div>
            <ul className="space-y-3 flex-grow mb-8 border-t border-slate-700 pt-6">
                {features.map(feature => <TierFeature key={feature} textKey={feature} />)}
            </ul>
            <Button
                disabled={isCurrent}
                className={`w-full justify-center mt-auto ${isCurrent ? '' : isPopular ? '' : 'bg-slate-600 hover:bg-slate-500'}`}
            >
                {isCurrent ? t('subscriptions_button_current') : t('subscriptions_button_choose')}
            </Button>
        </Card>
    );
}

const SubscriptionsView: React.FC = () => {
    const { t } = useTranslations();

    const tiers: SubscriptionTierProps[] = [
        {
            nameKey: 'subscriptions_plan_basic_name',
            priceKey: 'subscriptions_plan_basic_price',
            features: [
                'subscriptions_feature_standard_quizzes',
                'subscriptions_feature_mistake_review',
                'subscriptions_feature_word_bank',
                'subscriptions_feature_conversation_limited',
            ],
            isCurrent: true,
        },
        {
            nameKey: 'subscriptions_plan_plus_name',
            priceKey: 'subscriptions_plan_plus_price',
            features: [
                'subscriptions_feature_standard_quizzes',
                'subscriptions_feature_mistake_review',
                'subscriptions_feature_word_bank',
                'subscriptions_feature_conversation_unlimited',
                'subscriptions_feature_root_analyzer',
            ],
            isPopular: true,
        },
        {
            nameKey: 'subscriptions_plan_pro_name',
            priceKey: 'subscriptions_plan_pro_price',
            features: [
                'subscriptions_feature_standard_quizzes',
                'subscriptions_feature_mistake_review',
                'subscriptions_feature_word_bank',
                'subscriptions_feature_conversation_unlimited',
                'subscriptions_feature_all_labs',
                'subscriptions_feature_advanced_feedback',
                'subscriptions_feature_priority_support',
            ],
        },
    ];

    return (
        <div className="w-full">
            <div className="text-center mb-16">
                <div className="relative inline-block">
                     <StarIcon className="w-16 h-16 mx-auto text-amber-400 mb-4" />
                     <div className="absolute top-0 left-0 w-16 h-16 animate-glow-primary rounded-full -z-10" style={{ animationDuration: '4s' }}></div>
                </div>
                <h2 className="text-4xl font-bold text-white">{t('subscriptions_title')}</h2>
                <p className="text-primary-300 font-semibold mt-2 max-w-xl mx-auto">{t('subscriptions_subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
                {tiers.map(tier => (
                    <SubscriptionTier key={tier.nameKey} {...tier} />
                ))}
            </div>
        </div>
    );
};

export default SubscriptionsView;