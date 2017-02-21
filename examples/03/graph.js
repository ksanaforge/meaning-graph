{"links":
  [{"source": "Register"       , "target": "Repair(Simple)" }
  ,{"source": "Repair(Simple)" , "target": "TestRepair"     }
  ,{"source": "TestRepair"     , "target": "AnalyzeDefect"  }
  ,{"source": "AnalyzeDefect"  , "target": "RestartRepair"  }
  ,{"source": "RestartRepair"  , "target": "TestRepair"     }
  ,{"source": "AnalyzeDefect"  , "target": "Repair(Complex)"}
  ,{"source": "Repair(Complex)", "target": "InformUser"     }
  ,{"source": "Repair(Complex)", "target": "ArchiveRepair"  }
 ]
}