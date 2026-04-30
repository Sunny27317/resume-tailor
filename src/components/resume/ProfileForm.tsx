"use client";

import type { ResumeProfile } from "@/types/resume";
import PersonalInfoForm from "./PersonalInfoForm";
import SummaryForm from "./SummaryForm";
import EducationSection from "./EducationSection";
import ExperienceSection from "./ExperienceSection";
import ProjectsSection from "./ProjectsSection";
import SkillsSection from "./SkillsSection";
import CertificationsSection from "./CertificationsSection";
import VolunteerSection from "./VolunteerSection";
import AwardsSection from "./AwardsSection";
import LanguagesSection from "./LanguagesSection";

interface Props {
  profile: ResumeProfile;
  onChange: (next: ResumeProfile) => void;
  errors: Record<string, string>;
}

export default function ProfileForm({ profile, onChange, errors }: Props) {
  return (
    <div className="space-y-5">
      <PersonalInfoForm
        value={profile.personal}
        onChange={(personal) => onChange({ ...profile, personal })}
        errors={errors}
      />
      <SummaryForm
        value={profile.summary}
        onChange={(summary) => onChange({ ...profile, summary })}
      />
      <ExperienceSection
        value={profile.experience}
        onChange={(experience) => onChange({ ...profile, experience })}
        errors={errors}
      />
      <EducationSection
        value={profile.education}
        onChange={(education) => onChange({ ...profile, education })}
        errors={errors}
      />
      <ProjectsSection
        value={profile.projects}
        onChange={(projects) => onChange({ ...profile, projects })}
        errors={errors}
      />
      <SkillsSection
        value={profile.skills}
        onChange={(skills) => onChange({ ...profile, skills })}
      />
      <CertificationsSection
        value={profile.certifications}
        onChange={(certifications) => onChange({ ...profile, certifications })}
      />
      <VolunteerSection
        value={profile.volunteerWork}
        onChange={(volunteerWork) => onChange({ ...profile, volunteerWork })}
      />
      <AwardsSection
        value={profile.awards}
        onChange={(awards) => onChange({ ...profile, awards })}
      />
      <LanguagesSection
        value={profile.languages}
        onChange={(languages) => onChange({ ...profile, languages })}
      />
      {errors["profile.content"] && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors["profile.content"]}
        </div>
      )}
    </div>
  );
}
