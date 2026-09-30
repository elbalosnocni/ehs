const CONFIG = {
  VERSION: '2.0.0',
  SPREADSHEET_ID: '',
  DRIVE_FOLDER_ID: '1reoBkxi7rlUoQvfP6erEMBzc6wNDU_1d',
  SESSION_HOURS: 6,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_MINUTES: 15,
  TIMEZONE: 'Asia/Ho_Chi_Minh',
  ROLES: { ADMIN:'Administrator', HR:'HR', HSE:'HSE', MANAGER:'Manager', VIEWER:'Viewer' },
  SHEETS: {
    USER:'USER', EMPLOYEE:'EMPLOYEE', ACCIDENT:'ACCIDENT', ATTACHMENT:'ATTACHMENT',
    ACCIDENT_ATTACHMENT:'ACCIDENT_ATTACHMENT', ACCIDENT_TIMELINE:'ACCIDENT_TIMELINE',
    INVESTIGATION:'INVESTIGATION', INVESTIGATION_EVIDENCE:'INVESTIGATION_EVIDENCE',
    FIVE_WHY:'FIVE_WHY', CAPA:'CAPA', CAPA_EVIDENCE:'CAPA_EVIDENCE', CAPA_VERIFICATION:'CAPA_VERIFICATION',
    MEDICAL:'MEDICAL', COST:'COST', BHXH:'BHXH', MASTER:'MASTER', SETTING:'SETTING',
    LOG:'LOG', AUDIT_LOG:'AUDIT_LOG'
  },
  HEADERS: {
    USER:['UserID','Username','PasswordHash','PasswordSalt','Role','Email','Status','FailedAttempts','LockedUntil','CreatedDate','LastLogin','MustChangePassword'],
    EMPLOYEE:['EmpID','FullName','Plant','Department','Position','DOB','Gender','HireDate','Status','Phone','Email','UpdatedDate'],
    ACCIDENT:['AccidentID','EmpID','FullName','Department','Plant','Position','Shift','IncidentDate','ReportDate','Location','IncidentType','Classification','Severity','InjuryType','BodyPart','InjuryFactor','ImmediateCause','RootCause','Witness','Description','InitialAction','MedicalRequired','Hospital','LostDays','LostTime','Status','InvestigationStatus','CAPAStatus','CreatedBy','CreatedDate','UpdatedBy','UpdatedDate'],
    ACCIDENT_ATTACHMENT:['FileID','RecordID','RecordType','FileName','MimeType','DriveFileId','DriveUrl','UploadedBy','UploadedDate','Description'],
    ACCIDENT_TIMELINE:['TimelineID','AccidentID','EventTime','EventType','Description','Actor','CreatedDate'],
    INVESTIGATION:['InvestigationID','AccidentID','Lead','InvestigationDate','Method','ImmediateCause','BasicCause','RootCause','FiveWhySummary','FishboneSummary','Conclusion','Status','ApprovedBy','ApprovedDate','CreatedBy','CreatedDate','UpdatedBy','UpdatedDate'],
    INVESTIGATION_EVIDENCE:['EvidenceID','InvestigationID','AccidentID','EvidenceType','Description','FileID','DriveFileId','DriveUrl','CreatedBy','CreatedDate'],
    FIVE_WHY:['FiveWhyID','InvestigationID','AccidentID','StepNo','Question','Answer','CreatedBy','CreatedDate'],
    CAPA:['CapaID','AccidentID','InvestigationID','RootCause','ActionType','Action','Assignee','Department','Priority','StartDate','DueDate','Progress','Status','EvidenceRequired','CompletedDate','VerifiedDate','Effectiveness','ClosedDate','CreatedBy','CreatedDate','UpdatedBy','UpdatedDate'],
    CAPA_EVIDENCE:['EvidenceID','CapaID','Description','FileID','DriveFileId','DriveUrl','UploadedBy','UploadedDate'],
    CAPA_VERIFICATION:['VerificationID','CapaID','VerifiedBy','VerificationDate','Effective','Findings','FollowUpDate','Status','CreatedDate'],
    MEDICAL:['MedicalID','AccidentID','EmpID','FirstAidTime','Provider','TreatmentType','Hospitalized','AdmissionDate','DischargeDate','Diagnosis','MedicalCost','SickLeaveDays','Notes','CreatedBy','CreatedDate'],
    COST:['CostID','AccidentID','CostType','Amount','Currency','Description','PaidDate','CreatedBy','CreatedDate'],
    BHXH:['BHXHID','AccidentID','EmpID','BenefitType','DecisionNo','StartDate','EndDate','TotalDaysOff','Amount','Status','CreatedDate'],
    MASTER:['BoPhan','Department','NguyenNhan','Cause','YeuToChanThuong','InjuryFactor','TrangThai','Status','IncidentType','Classification','Severity','ActionType','Priority','Effectiveness'],
    SETTING:['Key','Value','Description','UpdatedDate'],
    AUDIT_LOG:['LogID','Timestamp','UserID','Username','Role','Action','Module','RecordID','OldValue','NewValue','Result','Details'],
    LOG:['LogID','UserID','Action','Timestamp','Details']
  }
};
