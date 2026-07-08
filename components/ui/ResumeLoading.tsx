"use client";

import React from "react";
import Lottie from "lottie-react";
import animationData from "../../assets/Text generation loop.json";
import "../../styles/resumeLoading.css";


interface ResumeLoadingProps {
  statusText?: string;
}

const ResumeLoading = ({ statusText }: ResumeLoadingProps) => {
  return (
    <div className="ai-loading-screen">
      <div className="ai-loading-card">
        <Lottie 
          animationData={animationData} 
          loop={true} 
          style={{ height: 250, width: 250 }}
        />
        <h2>Analyzing your resume...</h2>
        <p className="status-text">
          {statusText || "Processing your document..."}
        </p>
      </div>
    </div>
  );
};

export default ResumeLoading;
