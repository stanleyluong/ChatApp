interface GoogleOneTapResponse {
  credential: string;
  select_by: string;
}

interface GoogleOneTapConfig {
  client_id: string;
  callback: (response: GoogleOneTapResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleAccounts {
  id: {
    initialize: (config: GoogleOneTapConfig) => void;
    prompt: () => void;
  };
}

interface Window {
  google?: {
    accounts: GoogleAccounts;
  };
} 