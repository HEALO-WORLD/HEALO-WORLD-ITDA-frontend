import type { ReferralSummary } from "./types";

export interface ReferralFilterCriteria {
    keyword: string;
    status: ReferralSummary["status"] | "";
    examType: ReferralSummary["examType"] | "";
    organizationName: string;
    dateFrom: string;
    dateTo: string;
}

export const INITIAL_REFERRAL_FILTER: ReferralFilterCriteria = {
    keyword: "",
    status: "",
    examType: "",
    organizationName: "",
    dateFrom: "",
    dateTo: "",
};


export function filterReferrals(
    referrals: readonly ReferralSummary[],
    criteria: ReferralFilterCriteria,
): ReferralSummary[] {
    const keyword = criteria.keyword.trim().toLowerCase();

    return referrals.filter((referral) => {
        // 통합 검색
        if (keyword) {
            const searchable = [
                referral.referralNumber,
                referral.virtualPatientId,
            ]
                .join(" ")
                .toLowerCase();

            if (!searchable.includes(keyword)) {
                return false;
            }
        }

        // 예약 상태
        if (criteria.status && referral.status !== criteria.status) {
            return false;
        }

        // 검사 유형
        if (criteria.examType && referral.examType !== criteria.examType) {
            return false;
        }

        // 검사기관
        if (
            criteria.organizationName &&
            referral.organizationName !== criteria.organizationName
        ) {
            return false;
        }

        // 검사 예정일
        if (criteria.dateFrom || criteria.dateTo) {
            const examDate = referral.scheduledAt.slice(0, 10);

            if (criteria.dateFrom && examDate < criteria.dateFrom) {
                return false;
            }

            if (criteria.dateTo && examDate > criteria.dateTo) {
                return false;
            }
        }

        return true;
    });
}