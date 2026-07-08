import { create } from "zustand";

interface ResumeState {
  activeResume: any | null;
  selectedSection: { type: string; index: number; highlightIndex?: number } | null;
  isSaving: boolean;
  
  setActiveResume: (resume: any) => void;
  updatePersonalInfo: (info: any) => void;
  updateSkills: (skills: any[]) => void;
  updateExperience: (exp: any[]) => void;
  updateExperienceHighlight: (expIdx: number, hlIdx: number, text: string) => void;
  updateProjects: (projects: any[]) => void;
  updateProjectHighlight: (projIdx: number, hlIdx: number, text: string) => void;
  updateFormatting: (formatting: any) => void;
  setSelectedSection: (section: { type: string; index: number; highlightIndex?: number } | null) => void;
  setIsSaving: (saving: boolean) => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  activeResume: null,
  selectedSection: null,
  isSaving: false,

  setActiveResume: (resume) => set({ activeResume: resume }),
  updatePersonalInfo: (info) => set((state) => ({
    activeResume: state.activeResume ? { ...state.activeResume, personalInfo: { ...state.activeResume.personalInfo, ...info } } : null
  })),
  updateSkills: (skills) => set((state) => ({
    activeResume: state.activeResume ? { ...state.activeResume, skills } : null
  })),
  updateExperience: (experience) => set((state) => ({
    activeResume: state.activeResume ? { ...state.activeResume, experience } : null
  })),
  updateExperienceHighlight: (expIdx, hlIdx, text) => set((state) => {
    if (!state.activeResume) return {};
    const exp = [...state.activeResume.experience];
    exp[expIdx].highlights[hlIdx] = text;
    return { activeResume: { ...state.activeResume, experience: exp } };
  }),
  updateProjects: (projects) => set((state) => ({
    activeResume: state.activeResume ? { ...state.activeResume, projects } : null
  })),
  updateProjectHighlight: (projIdx, hlIdx, text) => set((state) => {
    if (!state.activeResume) return {};
    const proj = [...state.activeResume.projects];
    proj[projIdx].highlights[hlIdx] = text;
    return { activeResume: { ...state.activeResume, projects: proj } };
  }),
  updateFormatting: (formatting) => set((state) => ({
    activeResume: state.activeResume ? { ...state.activeResume, formatting: { ...state.activeResume.formatting, ...formatting } } : null
  })),
  setSelectedSection: (section) => set({ selectedSection: section }),
  setIsSaving: (saving) => set({ isSaving: saving })
}));
export default useResumeStore;
