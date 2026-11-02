let electron = require("electron");
//#region lib/types/ipc.js
/** Typed preload operations exposed only by the Electron shell. */
/** IPC channel names kept private to the desktop application bundle. */
const DESKTOP_IPC = {
	shortcutsInput: "dsh-desktop:shortcuts-input",
	shortcutsCloseWindow: "dsh-desktop:shortcuts-close-window",
	shortcutsGet: "dsh-desktop:shortcuts-get",
	shortcutsEdit: "dsh-desktop:shortcuts-edit",
	shortcutsChanged: "dsh-desktop:shortcuts-changed",
	shortcutsRecording: "dsh-desktop:shortcuts-recording",
	boot: "dsh-desktop:boot",
	enterWorkspace: "dsh-desktop:enter-workspace",
	onboardingActive: "dsh-desktop:onboarding-active",
	onboardingApiKey: "dsh-desktop:onboarding-api-key",
	bootFailed: "dsh-desktop:boot-failed",
	browserAcquire: "dsh-desktop:browser-acquire",
	browserRelease: "dsh-desktop:browser-release",
	browserOpenRequested: "dsh-desktop:browser-open-requested",
	directoryPick: "dsh-desktop:directory-pick",
	deviceInfo: "dsh-desktop:device-info",
	localeBootstrap: "dsh-desktop:locale-bootstrap",
	localeChanged: "dsh-desktop:locale-changed",
	updatesStatus: "dsh-desktop:updates-status",
	updatesOpen: "dsh-desktop:updates-open",
	updatesPresentation: "dsh-desktop:updates-presentation",
	nativeThemeSet: "dsh-desktop:native-theme-set",
	windowFullscreen: "dsh-desktop:window-fullscreen",
	windowsAppearance: "dsh-desktop:windows-appearance",
	windowsMenu: "dsh-desktop:windows-menu"
};
//#endregion
//#region lib/types/platform-ipc.js
/** Shared names for the desktop Platform bridge. */
/** Private desktop channels; the Platform renderer receives bootstrap and locale updates. */
const PLATFORM_IPC = {
	bootstrap: "dsh-platform:bootstrap",
	localeChanged: "dsh-platform:locale-changed",
	open: "dsh-platform:open",
	bounds: "dsh-platform:bounds",
	close: "dsh-platform:close"
};
//#endregion
//#region lib/types/preload-platform.js
/** Marks the document root with the host platform so shared Web UI CSS can scope desktop-only rules. */
/**
* Sets `data-platform` (e.g. `darwin`) on `<html>`, deferring to DOMContentLoaded
* when the preload runs before the document root exists.
*/
function markDocumentPlatform() {
	const mark = () => {
		document.documentElement.dataset.platform = process.platform;
	};
	if (document.documentElement === null) window.addEventListener("DOMContentLoaded", mark);
	else mark();
}
/**
* Mirrors the window's macOS and Windows fullscreen state onto `<html data-fullscreen>` so
* CSS drops the clearance for hidden native window controls. The main
* process sends the state on every transition and after each load.
*/
function syncWindowFullscreen() {
	if (process.platform !== "darwin" && process.platform !== "win32") return;
	electron.ipcRenderer.on(DESKTOP_IPC.windowFullscreen, (_event, fullscreen) => {
		const root = document.documentElement;
		if (root === null) return;
		if (fullscreen) root.dataset.fullscreen = "true";
		else delete root.dataset.fullscreen;
	});
}
//#endregion
//#region lib/types/preload-theme.js
/** Mirrors the Web UI's theme source into Electron's native theme so native chrome and Platform login pages follow the app palette. */
/** Root attribute written by the Web UI's theme bootstrap and presenter (ui-theme / ui-layout). */
const THEME_SOURCE_ATTRIBUTE = "data-ds-theme-source";
/**
* Watches `html[data-ds-theme-source]` and forwards each value to the main
* process, which sets `nativeTheme.themeSource`. Native chrome and renderer
* `prefers-color-scheme` queries on every platform then follow the app's
* theme preference instead of the OS appearance while `system` keeps
* following the OS; the macOS sidebar vibrancy material is one such consumer.
* The main process reads the same value back as `shouldUseDarkColors` when a
* Platform login link needs the resolved palette.
*/
function syncNativeTheme() {
	let sent;
	const send = () => {
		const value = document.documentElement.getAttribute(THEME_SOURCE_ATTRIBUTE);
		if (value === null || value === sent) return;
		sent = value;
		electron.ipcRenderer.send(DESKTOP_IPC.nativeThemeSet, value);
	};
	const observe = () => {
		new MutationObserver(send).observe(document.documentElement, { attributeFilter: [THEME_SOURCE_ATTRIBUTE] });
		send();
	};
	if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", observe, { once: true });
	else observe();
}
//#endregion
//#region lib/types/locale.js
/** Typed English and Chinese copy owned by the Electron shell. */
const en = {
	cliCommandMenu: "Manage dsh Command…",
	cliCommandTitle: "Manage dsh Command",
	cliCommandLocation: "Desktop command: {path}",
	cliCommandSelected: "Current dsh command: {path}",
	cliCommandTarget: "Current launcher target: {path}",
	cliCommandShadowed: "Another dsh takes precedence. Remove or reorder that installation to use the Desktop command by default. You can also run the Desktop command by its full path.",
	cliCommandSelectionUnknown: "Your shell command could not be verified. An alias or another dsh installation may take precedence.",
	cliCommandInstalled: "The Desktop command is installed.",
	cliCommandNotInstalled: "Add the Desktop command to your terminal.",
	cliCommandBroken: "The Desktop command needs repair.",
	cliCommandInstall: "Install",
	cliCommandRepair: "Repair",
	cliCommandRemove: "Remove",
	cliCommandClose: "Close",
	cliCommandSwitch: "Continue with the Desktop command?",
	cliCommandPreserve: "An existing command will be preserved. Other installations and shell startup files will not be changed.",
	cliCommandContinue: "Continue",
	cliCommandInstallApp: "Install Desktop in your Applications folder before managing the dsh command.",
	cliCommandUpdating: "An update is being installed. Manage the command after installation finishes.",
	cliCommandNewTerminal: "Open a new terminal and run dsh --version.",
	cliCommandRemoved: "Desktop command registration removed.",
	cliCommandPreviousRestored: "The previous launcher has been restored.",
	cliCommandOtherKept: "Other command installations have been left in place.",
	cliCommandBackupKept: "A previous launcher is preserved at: {path}",
	cliCommandChanged: "The command or PATH changed while this dialog was open. Open Manage dsh Command again to review the current state.",
	cliCommandOwnershipError: "The command registration or backup changed. No unrelated command was removed.",
	cliCommandFailed: "The command could not be updated. Check that the application is installed and the destination is writable, then retry.",
	application: "Application",
	fileMenu: "File",
	closePage: "Close Page or Window",
	aboutMenu: "About DeepSeek Harness",
	aboutProduct: "DeepSeek Harness",
	aboutVersion: "Version V{version}",
	hideApplication: "Hide DeepSeek Harness",
	hideOtherApplications: "Hide Others",
	showAllApplications: "Show All",
	quitApplication: "Quit DeepSeek Harness",
	openApplication: "Open DeepSeek Harness",
	quit: "Quit",
	cancel: "Cancel",
	quitTitle: "Quit DeepSeek Harness?",
	quitActiveTasks: "Running tasks will be interrupted.",
	quitScheduledTasks: "Scheduled tasks will not run while the app is closed.",
	quitActiveAndScheduledTasks: "Running tasks will be interrupted, and scheduled tasks will not run while the app is closed.",
	backgroundNoticeBody: "Running tasks will continue. You can reopen the window from the system tray.",
	backgroundNoticeConfirm: "Confirm",
	edit: "Edit",
	menuBar: "Application menu",
	delete: "Delete",
	undo: "Undo",
	redo: "Redo",
	cut: "Cut",
	copy: "Copy",
	paste: "Paste",
	selectAll: "Select All",
	startupFailed: "DeepSeek Harness is unavailable",
	fatalSummary: "The application could not start or stopped unexpectedly.",
	startupAddressInUse: "Another DSH instance (such as dsh web or the desktop app) is running. They cannot start at the same time. Quit the other running DSH instance, then restart.",
	diagnosticTruncated: "… Error details shortened.",
	reportWrittenTo: "Diagnostic report: {path}",
	startupReinstallAdvice: "If application files are missing or damaged, close the application and reinstall it. Your tasks are stored separately.",
	exitApplication: "Exit",
	restartApplication: "Restart",
	recoveryOperationFailed: "The recovery operation failed",
	disableThirdPartyPlugins: "Disable third-party plugins, back up profile patch, and restart",
	welcomeTitle: "DeepSeek Harness",
	welcomeBrand: "DeepSeek Harness",
	welcomeTaglineBefore: "Welcome to ",
	welcomeTaglineBrand: "DeepSeek Harness",
	welcomeTaglineAfter: "",
	welcomeDescription: "Build potential. Explore intelligence.",
	welcomeAuthStarting: "Opening sign in…",
	welcomeAuthWaiting: "Browser didn’t open automatically?",
	welcomeAuthWaitingDescription: "Copy the sign-in link and open it in your browser to sign in.",
	welcomeAuthExchanging: "Completing sign in…",
	welcomeAuthExpired: "Sign in timed out",
	welcomeAuthExpiredDescription: "Sign in again to continue",
	welcomeAuthFailed: "Could not complete sign in. Please try again.",
	welcomeAuthCopyLink: "Copy sign-in link",
	welcomeAuthCopied: "Copied",
	welcomeAuthCopyFailed: "Could not copy. Try again.",
	welcomeAuthCancel: "Cancel",
	welcomeAuthRetry: "Sign in again",
	welcomeSignIn: "Sign in",
	welcomeApiKey: "Add API Key",
	welcomeKeyTitle: "Add an API key to get started",
	welcomeKeyDescription: "Configure official DeepSeek models to start using Harness",
	welcomeKeyPlaceholder: "Enter API key",
	welcomeKeySave: "Save and continue",
	welcomeKeyLater: "Set up later",
	welcomeKeyBack: "Back to sign in",
	welcomeSessionExpired: "You have signed out of your account, please log in again.",
	welcomeKeyBlank: "Enter an API key.",
	welcomeKeyInvalid: "Enter the API key itself, without quotes, spaces, or an environment-variable assignment.",
	welcomeKeyFailed: "Could not save the API key. Please try again.",
	welcomeContinueFailed: "Could not open the workspace. Please try again.",
	checkUpdatesMenu: "Check for Updates…",
	reloadPageMenu: "Reload Page",
	restartAppHostMenu: "Restart App and Host",
	updateCheckFailedTitle: "Update Check Failed",
	updateCheckFailed: "Could not check for updates. Please try again later.",
	updateDownloadFailed: "Could not download the update. Please try again.",
	updateInstallFailed: "Could not install the update. Please try again later.",
	updateCheckNetworkFailed: "Could not check for updates. Check your connection and try again.",
	updateDownloadNetworkFailed: "Could not download the update. Check your connection and try again.",
	updateInstallNetworkFailed: "Could not install the update. Check your connection and try again.",
	unknownError: "Unknown error",
	updateCheckTitle: "Check for Updates",
	updateCurrentDetail: "Current version: {version}",
	updateCurrent: "You’re up to date!",
	updateChecking: "Checking for updates…",
	updateDownload: "Download update",
	updateDownloadedTitle: "Version {version} is ready to install",
	updateDownloadedDetail: "The app will close during the update and reopen automatically when it is complete.",
	updateDownloadedDetailWindows: "The app will close temporarily during the update and reopen automatically when it is complete.\n\nThe update may take some time. Please wait and do not launch the app again during installation.",
	updateClose: "Close",
	updateAcknowledge: "OK",
	updateLater: "Update later",
	updateDownloading: "Downloading {percent}%…",
	updateVerifying: "Verifying update files…",
	updateInstalling: "Preparing to restart…",
	updateRetry: "Retry update",
	updateActiveTasks: "Tasks are still in progress",
	updateActiveTasksDetail: "Updating will stop the tasks in progress and restart the app. Continue?",
	updateStopTasks: "Stop tasks and update",
	updateTasksChanged: "New tasks have started. Confirm again to stop the tasks and update.",
	updateTasksUnavailable: "Task status is unavailable. Try updating again when the workspace is ready.",
	updateStopFailed: "Could not safely stop the tasks. The update has not been installed. Please try again later.",
	updateTechnicalDetails: "View technical details",
	updateTitle: "DeepSeek Harness Update",
	updateAvailable: "New version available: {version}",
	updateDetail: "Once the download is complete, you can install the update and restart the app.",
	installAndRestart: "Install and Restart",
	later: "Later",
	updateFailedTitle: "Update Failed",
	mandatoryTitle: "Update to continue",
	mandatoryDetail: "This version is no longer supported. Update to continue. Tasks in progress will keep running until you confirm installation and restart.",
	mandatoryUnavailable: "Could not check update requirements. Please try again later.",
	policyLoginTitle: "Sign in to the test environment",
	policyLoginRequired: "Sign in with Feishu to check update requirements for this test build. Signing in will not download or install an update.",
	policyLogin: "Sign in with Feishu",
	policyLoginFailed: "Feishu sign-in did not complete. Please try again.",
	policyLoginLoading: "Loading sign-in page…",
	mandatoryNoRelease: "No compatible update was found. Check again or contact support.",
	mandatoryRefresh: "Check again",
	mandatoryPage: "Download from the official website",
	mandatoryCopy: "Copy download link",
	mandatoryPageFailed: "Could not open the official download page. Copy the link and open it in your browser.",
	mandatoryActionFailed: "The action failed. Please try again. You can use the app again after the update is complete.",
	mandatoryReady: "Update ready",
	mandatoryVersion: "New version: {version}",
	mandatoryReadyDetail: "The app will close during the update and reopen automatically when it is complete.",
	mandatoryDeferred: "Tasks in progress will keep running. Complete the update before using the app again.",
	mandatoryContinue: "Continue update",
	mandatoryInspecting: "Checking tasks…",
	mandatoryStopping: "Stopping tasks…",
	mandatoryRestarting: "The app will restart shortly. Please wait.",
	mandatoryDownloadFailed: "The update files could not be downloaded or prepared. Please retry.",
	mandatoryInstallFailed: "The update has not been installed. Check the tasks again and retry.",
	mandatoryOpenHelp: "Page didn’t open?",
	mandatoryReopen: "Open the official download page again",
	mandatoryCopied: "Link copied",
	mandatoryCopyFailed: "Could not copy the link. Select and copy it below.",
	mandatoryAddress: "Download link",
	mandatoryNotification: "Return to the application to confirm installation and restart."
};
const zh = {
	cliCommandMenu: "dsh 명령 관리…",
	cliCommandTitle: "dsh 명령 관리",
	cliCommandLocation: "Desktop 명령: {path}",
	cliCommandSelected: "현재 dsh 명령: {path}",
	cliCommandTarget: "현재 실행기 대상: {path}",
	cliCommandShadowed: "다른 dsh가 우선순위가 더 높습니다. 기본으로 Desktop 명령을 쓰려면 그 설치를 지우거나 순서를 조정하세요. 전체 경로로 Desktop 명령을 실행할 수도 있습니다.",
	cliCommandSelectionUnknown: "셸의 명령을 확인할 수 없습니다. 별칭이나 다른 dsh 설치가 우선순위가 더 높을 수 있습니다.",
	cliCommandInstalled: "Desktop 명령이 설치되었습니다.",
	cliCommandNotInstalled: "Desktop 명령을 터미널에 추가합니다.",
	cliCommandBroken: "Desktop 명령을 고쳐야 합니다.",
	cliCommandInstall: "설치",
	cliCommandRepair: "고치기",
	cliCommandRemove: "제거",
	cliCommandClose: "닫기",
	cliCommandSwitch: "Desktop 명령을 계속 쓸까요?",
	cliCommandPreserve: "기존 명령은 그대로 두며, 다른 설치나 셸 시작 파일은 고치지 않습니다.",
	cliCommandContinue: "계속",
	cliCommandInstallApp: "먼저 Desktop을 ‘응용 프로그램’ 폴더에 설치한 뒤 dsh 명령을 관리하세요.",
	cliCommandUpdating: "업데이트 설치 중입니다. 설치가 끝난 뒤 명령을 관리하세요.",
	cliCommandNewTerminal: "새 터미널을 열고 dsh --version을 실행하세요.",
	cliCommandRemoved: "Desktop 명령 등록을 지웠습니다.",
	cliCommandPreviousRestored: "이전 실행기를 복원했습니다.",
	cliCommandOtherKept: "다른 명령 설치는 그대로입니다.",
	cliCommandBackupKept: "이전 실행기 위치: {path}",
	cliCommandChanged: "대화상자가 열려 있는 동안 명령이나 PATH가 바뀌었습니다. ‘dsh 명령 관리’를 다시 열어 현재 상태를 확인하세요.",
	cliCommandOwnershipError: "명령 등록이나 백업이 바뀌어 관련 없는 명령은 지우지 않았습니다.",
	cliCommandFailed: "명령을 업데이트할 수 없습니다. 앱이 설치되어 있는지, 대상 위치에 쓸 수 있는지 확인한 뒤 다시 시도하세요.",
	application: "앱",
	fileMenu: "파일",
	closePage: "페이지나 창 닫기",
	aboutMenu: "DeepSeek Harness 정보",
	aboutProduct: "DeepSeek Harness",
	aboutVersion: "버전 V{version}",
	hideApplication: "DeepSeek Harness 숨기기",
	hideOtherApplications: "다른 항목 숨기기",
	showAllApplications: "모두 보기",
	quitApplication: "DeepSeek Harness 종료",
	openApplication: "DeepSeek Harness 열기",
	quit: "종료",
	cancel: "취소",
	quitTitle: "DeepSeek Harness를 종료할까요?",
	quitActiveTasks: "실행 중인 작업이 중단됩니다",
	quitScheduledTasks: "앱이 꺼져 있는 동안에는 예약 작업이 실행되지 않습니다",
	quitActiveAndScheduledTasks: "실행 중인 작업이 중단되고, 앱이 꺼져 있는 동안에는 예약 작업이 실행되지 않습니다",
	backgroundNoticeBody: "실행 중인 작업은 중단되지 않습니다. 시스템 트레이에서 창을 다시 열 수 있습니다",
	backgroundNoticeConfirm: "확인",
	edit: "편집",
	menuBar: "앱 메뉴",
	delete: "삭제",
	undo: "실행 취소",
	redo: "다시 실행",
	cut: "잘라내기",
	copy: "복사",
	paste: "붙여넣기",
	selectAll: "모두 선택",
	startupFailed: "DeepSeek Harness를 쓸 수 없습니다",
	fatalSummary: "앱을 시작할 수 없거나 예기치 않게 멈췄습니다.",
	startupAddressInUse: "다른 DSH(다른 dsh web, 데스크톱 앱 등)가 실행 중이라 함께 시작할 수 없습니다. 다른 DSH를 끈 뒤 다시 시작하세요.",
	diagnosticTruncated: "… 오류 상세가 잘렸습니다.",
	reportWrittenTo: "진단 보고서: {path}",
	startupReinstallAdvice: "앱 파일이 없거나 손상되었다면 앱을 닫고 다시 설치하세요. 작업 데이터는 따로 저장되어 있습니다.",
	exitApplication: "종료",
	restartApplication: "다시 시작",
	recoveryOperationFailed: "복구 작업 실패",
	disableThirdPartyPlugins: "서드파티 플러그인 끄고, 프로필 패치 백업 후 다시 시작",
	welcomeTitle: "DeepSeek Harness",
	welcomeBrand: "DeepSeek Harness",
	welcomeTaglineBefore: "환영합니다, ",
	welcomeTaglineBrand: "DeepSeek Harness",
	welcomeTaglineAfter: "",
	welcomeDescription: "가능성을 조립하고, 지능을 탐구하세요",
	welcomeAuthStarting: "로그인 여는 중…",
	welcomeAuthWaiting: "브라우저가 자동으로 열리지 않았나요?",
	welcomeAuthWaitingDescription: "로그인 링크를 복사해 브라우저에서 직접 열어 로그인하세요",
	welcomeAuthExchanging: "로그인 마무리하는 중…",
	welcomeAuthExpired: "로그인 시간 초과",
	welcomeAuthExpiredDescription: "다시 로그인한 뒤 계속하세요",
	welcomeAuthFailed: "로그인을 끝내지 못했습니다. 다시 시도하세요.",
	welcomeAuthCopyLink: "로그인 링크 복사",
	welcomeAuthCopied: "복사됨",
	welcomeAuthCopyFailed: "복사 실패. 다시 시도하세요",
	welcomeAuthCancel: "취소",
	welcomeAuthRetry: "다시 로그인",
	welcomeSignIn: "로그인",
	welcomeApiKey: "API 키 추가",
	welcomeKeyTitle: "API 키를 추가해 시작하세요",
	welcomeKeyDescription: "DeepSeek 공식 모델을 설정하면 바로 쓸 수 있습니다",
	welcomeKeyPlaceholder: "API 키 입력",
	welcomeKeySave: "저장하고 계속",
	welcomeKeyLater: "나중에 설정",
	welcomeKeyBack: "로그인으로 돌아가기",
	welcomeSessionExpired: "로그인 정보가 만료되었습니다. 다시 로그인하세요",
	welcomeKeyBlank: "API 키를 입력하세요.",
	welcomeKeyInvalid: "API 키만 입력하세요. 따옴표, 공백, 환경 변수 대입은 넣지 마세요.",
	welcomeKeyFailed: "API 키를 저장할 수 없습니다. 다시 시도하세요.",
	welcomeContinueFailed: "작업 공간을 열 수 없습니다. 다시 시도하세요.",
	checkUpdatesMenu: "업데이트 확인…",
	reloadPageMenu: "페이지 새로 고침",
	restartAppHostMenu: "앱과 호스트 다시 시작",
	updateCheckFailedTitle: "업데이트 확인 실패",
	updateCheckFailed: "업데이트 확인에 실패했습니다. 잠시 뒤 다시 시도하세요.",
	updateDownloadFailed: "업데이트 내려받기에 실패했습니다. 다시 시도하세요.",
	updateInstallFailed: "업데이트 설치에 실패했습니다. 잠시 뒤 다시 시도하세요.",
	updateCheckNetworkFailed: "업데이트 확인에 실패했습니다. 네트워크 연결을 확인한 뒤 다시 시도하세요.",
	updateDownloadNetworkFailed: "업데이트 내려받기에 실패했습니다. 네트워크 연결을 확인한 뒤 다시 시도하세요.",
	updateInstallNetworkFailed: "업데이트 설치에 실패했습니다. 네트워크 연결을 확인한 뒤 다시 시도하세요.",
	unknownError: "알 수 없는 오류",
	updateCheckTitle: "업데이트 확인",
	updateCurrentDetail: "현재 버전: {version}",
	updateCurrent: "최신 버전입니다",
	updateChecking: "업데이트 확인 중…",
	updateDownload: "업데이트 내려받기",
	updateDownloadedTitle: "새 버전 {version}이(가) 준비되었습니다",
	updateDownloadedDetail: "업데이트하는 동안 앱이 잠시 꺼지고, 끝나면 자동으로 열립니다.",
	updateDownloadedDetailWindows: "업데이트하는 동안 앱이 잠시 꺼지고, 끝나면 자동으로 열립니다.\n\n업데이트에 시간이 걸릴 수 있으니 기다려 주시고, 그동안 앱을 다시 실행하지 마세요.",
	updateClose: "닫기",
	updateAcknowledge: "확인",
	updateLater: "나중에 업데이트",
	updateDownloading: "내려받는 중 {percent}%…",
	updateVerifying: "업데이트 파일 검증 중…",
	updateInstalling: "재시작 준비 중…",
	updateRetry: "업데이트 다시 시도",
	updateActiveTasks: "진행 중인 작업이 있습니다",
	updateActiveTasksDetail: "업데이트하면 진행 중인 작업을 멈추고 앱을 다시 시작합니다. 계속할까요?",
	updateStopTasks: "작업 멈추고 업데이트",
	updateTasksChanged: "새 작업이 실행되기 시작했습니다. 작업을 멈추고 업데이트할지 다시 확인하세요.",
	updateTasksUnavailable: "작업 상태를 확인할 수 없습니다. 작업 공간이 준비된 뒤 업데이트를 다시 시도하세요.",
	updateStopFailed: "작업을 안전하게 멈추지 못해 업데이트를 설치하지 않았습니다. 잠시 뒤 다시 시도하세요.",
	updateTechnicalDetails: "기술 상세 보기",
	updateTitle: "DeepSeek Harness 업데이트",
	updateAvailable: "새 버전 {version} 발견",
	updateDetail: "내려받기가 끝나면 설치하고 앱을 다시 시작할 수 있습니다.",
	installAndRestart: "설치하고 재시작",
	later: "나중에",
	updateFailedTitle: "업데이트 실패",
	mandatoryTitle: "업데이트한 뒤 계속 쓰세요",
	mandatoryDetail: "현재 버전은 지원이 끝났습니다. 업데이트한 뒤 계속 쓰세요. 설치와 재시작을 확인하기 전까지 진행 중인 작업은 계속 실행됩니다.",
	mandatoryUnavailable: "지금은 업데이트 요구 사항을 확인할 수 없습니다. 잠시 뒤 다시 시도하세요.",
	policyLoginTitle: "테스트 환경 로그인",
	policyLoginRequired: "이 테스트 버전은 업데이트 요구 사항을 확인하려면 먼저 Feishu로 로그인해야 합니다. 로그인해도 업데이트를 내려받거나 설치하지 않습니다.",
	policyLogin: "Feishu로 로그인",
	policyLoginFailed: "Feishu 로그인을 끝내지 못했습니다. 다시 시도하세요.",
	policyLoginLoading: "로그인 페이지 불러오는 중…",
	mandatoryNoRelease: "맞는 업데이트를 찾지 못했습니다. 다시 확인하거나 지원 담당자에게 문의하세요.",
	mandatoryRefresh: "다시 확인",
	mandatoryPage: "공식 사이트에서 내려받기",
	mandatoryCopy: "다운로드 링크 복사",
	mandatoryPageFailed: "공식 다운로드 페이지를 열 수 없습니다. 링크를 복사해 브라우저에서 여세요.",
	mandatoryActionFailed: "작업에 실패했습니다. 다시 시도하세요. 업데이트를 끝내야 앱을 계속 쓸 수 있습니다.",
	mandatoryReady: "업데이트 준비 완료",
	mandatoryVersion: "새 버전: {version}",
	mandatoryReadyDetail: "업데이트하는 동안 앱이 잠시 꺼지고, 끝나면 자동으로 열립니다.",
	mandatoryDeferred: "진행 중인 작업은 계속 실행됩니다. 업데이트를 끝낸 뒤 앱을 쓰세요.",
	mandatoryContinue: "업데이트 계속",
	mandatoryInspecting: "작업 상태 확인 중…",
	mandatoryStopping: "작업 멈추는 중…",
	mandatoryRestarting: "앱이 곧 다시 시작됩니다. 잠시 기다리세요.",
	mandatoryDownloadFailed: "업데이트 파일을 내려받거나 준비하지 못했습니다. 다시 시도하세요.",
	mandatoryInstallFailed: "업데이트를 아직 설치하지 않았습니다. 작업을 다시 확인한 뒤 시도하세요.",
	mandatoryOpenHelp: "페이지가 열리지 않았나요?",
	mandatoryReopen: "공식 사이트에서 다시 내려받기",
	mandatoryCopied: "링크 복사됨",
	mandatoryCopyFailed: "복사 실패. 아래 링크를 직접 선택해 복사하세요.",
	mandatoryAddress: "다운로드 링크",
	mandatoryNotification: "앱으로 돌아가 설치와 재시작을 확인하세요."
};
/** Resolve Electron's locale to one shipped Desktop dictionary. */
function resolveDesktopLocale(locale) {
	return locale.toLowerCase().startsWith("zh") ? {
		id: "zh-CN",
		messages: zh
	} : {
		id: "en",
		messages: en
	};
}
//#endregion
//#region lib/types/preload-menu.js
/** Windows caption menu labels and native popup anchors, isolated from the Web client. */
/**
* Mount the Windows caption menubar without moving focus out of the active editor.
* @returns Language refresh and document teardown operations.
*/
function installWindowsMenu() {
	const host = document.createElement("div");
	host.dataset.windowsMenu = "";
	const shadow = host.attachShadow({ mode: "open" });
	const style = document.createElement("style");
	style.textContent = `
    :host { position: fixed; top: 0; left: var(--dsh-windows-menu-start, 48px); z-index: 1100;
      height: var(--dsh-windows-titlebar-height); display: flex; align-items: center;
      font-family: var(--dsw-font-family); -webkit-app-region: no-drag; }
    [role=menubar] { display: flex; gap: 2px; }
    button { height: 28px; padding: 0 10px; border: 0; border-radius: 6px;
      background: transparent; color: var(--dsw-alias-label-secondary);
      font: inherit; font-size: 14px; cursor: default; }
    button:hover, button[aria-expanded=true] { background: var(--dsw-alias-interactive-bg-hover);
      color: var(--dsw-alias-label-primary); }
    button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: -2px; }
    :host-context(html[data-input-modality='pointer']) button:focus-visible { outline-color: transparent; }
  `;
	const bar = document.createElement("div");
	bar.setAttribute("role", "menubar");
	let restoreEditor = () => {};
	const rememberEditor = (event) => {
		const target = event.composedPath()[0];
		if (!(target instanceof HTMLElement) || target === host || shadow.contains(target)) return;
		if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement) && !target.matches("[contenteditable=\"true\"]")) return;
		const selection = document.getSelection();
		const ranges = selection === null ? [] : Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange());
		const input = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target : void 0;
		const start = input?.selectionStart;
		const end = input?.selectionEnd;
		const direction = input?.selectionDirection;
		restoreEditor = () => {
			if (!target.isConnected) return;
			target.focus({ preventScroll: true });
			if (input !== void 0 && start != null && end != null) input.setSelectionRange(start, end, direction ?? void 0);
			else if (selection !== null && ranges.length > 0) {
				selection.removeAllRanges();
				for (const range of ranges) selection.addRange(range);
			}
		};
	};
	document.addEventListener("focusout", rememberEditor, true);
	const createButton = (name, index) => {
		const button = document.createElement("button");
		button.type = "button";
		button.setAttribute("role", "menuitem");
		button.setAttribute("aria-haspopup", "menu");
		button.setAttribute("aria-expanded", "false");
		button.tabIndex = index === 0 ? 0 : -1;
		button.addEventListener("pointerdown", (event) => {
			event.preventDefault();
		});
		button.addEventListener("mousedown", (event) => {
			event.preventDefault();
		});
		const open = async () => {
			if (button.getAttribute("aria-expanded") === "true") return;
			const rect = button.getBoundingClientRect();
			button.setAttribute("aria-expanded", "true");
			if (document.activeElement === host) restoreEditor();
			try {
				await electron.ipcRenderer.invoke(DESKTOP_IPC.windowsMenu, name, rect.left, rect.bottom);
			} catch (error) {
				console.error("Desktop caption menu failed", error);
			} finally {
				button.setAttribute("aria-expanded", "false");
			}
		};
		button.addEventListener("click", () => {
			open();
		});
		button.addEventListener("keydown", (event) => {
			if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
				event.preventDefault();
				const next = buttons[index === 0 ? 1 : 0];
				button.tabIndex = -1;
				next.tabIndex = 0;
				next.focus();
			} else if (event.key === "ArrowDown") {
				event.preventDefault();
				open();
			}
		});
		bar.append(button);
		return button;
	};
	const buttons = [createButton("application", 0), createButton("edit", 1)];
	shadow.append(style, bar);
	const mount = () => {
		if (document.querySelector("[data-shell-overlay]") === null) return;
		document.body.append(host);
		observer.disconnect();
	};
	const observer = new MutationObserver(mount);
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
	mount();
	const update = () => {
		const { messages } = resolveDesktopLocale(document.documentElement.lang);
		bar.setAttribute("aria-label", messages.menuBar);
		buttons[0].textContent = messages.application;
		buttons[1].textContent = messages.edit;
	};
	update();
	return {
		update,
		dispose: () => {
			observer.disconnect();
			document.removeEventListener("focusout", rememberEditor, true);
			host.remove();
		}
	};
}
//#endregion
//#region lib/types/preload-windows.js
/** Synchronizes Windows context menus and caption colors with the application document. */
/** Install the Windows-only titlebar marker and observe application language and palette changes. */
function syncWindowsAppearance() {
	if (process.platform !== "win32") return;
	const mark = () => {
		const root = document.documentElement;
		root.dataset.windowsTitlebar = "";
		root.style.setProperty("--dsh-windows-titlebar-height", `40px`);
	};
	if (document.documentElement !== null) mark();
	const install = () => {
		mark();
		const root = document.documentElement;
		const menu = installWindowsMenu();
		const probe = document.createElement("span");
		probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;background-color:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary)";
		document.body.append(probe);
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = 1;
		const context = canvas.getContext("2d", { willReadFrequently: true });
		if (context === null) throw new Error("Desktop caption requires a 2D canvas context");
		const nativeColor = (color) => {
			context.clearRect(0, 0, 1, 1);
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
			return `rgba(${red}, ${green}, ${blue}, ${Number(alpha) / 255})`;
		};
		let previous = "";
		const send = () => {
			const style = getComputedStyle(probe);
			const color = nativeColor(style.backgroundColor);
			const symbolColor = nativeColor(style.color);
			const values = [
				root.lang,
				color,
				symbolColor
			];
			const current = JSON.stringify(values);
			if (current === previous) return;
			previous = current;
			menu.update();
			electron.ipcRenderer.send(DESKTOP_IPC.windowsAppearance, ...values);
		};
		const observer = new MutationObserver(send);
		observer.observe(root, {
			attributes: true,
			attributeFilter: ["lang"]
		});
		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ["data-ds-dark-theme", "style"]
		});
		observer.observe(document.head, {
			childList: true,
			subtree: true,
			characterData: true
		});
		document.head.addEventListener("load", send, true);
		window.addEventListener("pagehide", () => {
			observer.disconnect();
			menu.dispose();
			probe.remove();
			document.head.removeEventListener("load", send, true);
		}, { once: true });
		send();
	};
	if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", install, { once: true });
	else install();
}
//#endregion
//#region lib/types/mandatory-update-ipc.js
/** Dependency-free IPC names shared with the sandboxed mandatory-update preload. */
const MANDATORY_IPC = {
	status: "dsh-desktop:mandatory-status",
	state: "dsh-desktop:mandatory-state",
	action: "dsh-desktop:mandatory-action"
};
//#endregion
//#region lib/types/preload-mandatory-overlay.js
/** Mounts the shell-owned Windows update document inside the main window's content area. */
/** Keep update actions on a private channel to the shell frame; the shared product DOM is not a tamper-proof display. */
function installMandatoryUpdateOverlay() {
	let disposed = false;
	let state;
	let host;
	let frame;
	let port;
	let closing;
	const publish = () => {
		port?.postMessage({
			type: "dsh-mandatory-state",
			state
		});
	};
	const remove = () => {
		port?.close();
		port = void 0;
		host?.remove();
		host = void 0;
		frame = void 0;
	};
	const render = () => {
		if (state === void 0 || document.readyState === "loading") return;
		if (!state.policy.blocking) {
			if (frame === void 0 || closing !== void 0) return;
			publish();
			closing = setTimeout(remove, 150);
			return;
		}
		clearTimeout(closing);
		closing = void 0;
		if (frame === void 0) {
			host = document.createElement("div");
			host.style.cssText = `position:fixed;top:40px;left:0;right:0;bottom:0;z-index:2147483647`;
			const shadow = host.attachShadow({ mode: "closed" });
			frame = document.createElement("iframe");
			frame.title = state.locale.messages.mandatoryTitle;
			frame.style.cssText = "display:block;width:100%;height:100%;border:0;background:transparent";
			frame.src = "dsh-app://shell/mandatory-update.html";
			shadow.append(frame);
			document.documentElement.append(host);
			frame.addEventListener("load", () => {
				port?.close();
				const channel = new MessageChannel();
				port = channel.port1;
				port.onmessage = message;
				frame?.contentWindow?.postMessage({ type: "dsh-mandatory-connect" }, "dsh-app://shell", [channel.port2]);
				publish();
				frame?.focus();
			});
		}
		publish();
	};
	const receive = (_event, next) => {
		state = next;
		render();
	};
	const message = (event) => {
		const value = event.data;
		if (typeof value !== "object" || value === null || !("type" in value)) return;
		if (value.type !== "dsh-mandatory-action" || !("id" in value) || !Number.isSafeInteger(value.id) || !("action" in value) || !("version" in value) || !("revision" in value)) return;
		const target = port;
		if (target === void 0) return;
		electron.ipcRenderer.invoke(MANDATORY_IPC.action, value.action, value.version, value.revision).then(() => {
			target.postMessage({
				type: "dsh-mandatory-result",
				id: value.id,
				ok: true
			});
		}, () => {
			target.postMessage({
				type: "dsh-mandatory-result",
				id: value.id,
				ok: false
			});
		});
	};
	const blockBackgroundKey = (event) => {
		if (frame === void 0 || state?.policy.blocking !== true || event.composedPath().some((target) => target instanceof HTMLElement && target.hasAttribute("data-windows-menu"))) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		frame.focus();
	};
	electron.ipcRenderer.on(MANDATORY_IPC.state, receive);
	electron.ipcRenderer.invoke(MANDATORY_IPC.status).then((initial) => {
		if (!disposed && state === void 0) {
			state = initial;
			render();
		}
	}, () => {});
	window.addEventListener("keydown", blockBackgroundKey, true);
	window.addEventListener("DOMContentLoaded", render, { once: true });
	window.addEventListener("pagehide", () => {
		disposed = true;
		clearTimeout(closing);
		remove();
		electron.ipcRenderer.off(MANDATORY_IPC.state, receive);
		window.removeEventListener("keydown", blockBackgroundKey, true);
		window.removeEventListener("DOMContentLoaded", render);
	}, { once: true });
}
//#endregion
//#region lib/types/preload-browser.js
/** Lease-scoped browser operations and one main-process event subscription per window. */
/** @returns browser operations that expose neither IPC nor Electron objects. */
function createDesktopBrowserBridge() {
	const listeners = /* @__PURE__ */ new Map();
	electron.ipcRenderer.on(DESKTOP_IPC.browserOpenRequested, (_event, request) => {
		if (typeof request !== "object" || request === null || !("lease" in request) || !("url" in request) || typeof request.lease !== "string" || typeof request.url !== "string") return;
		const callbacks = listeners.get(request.lease);
		if (callbacks === void 0) return;
		for (const callback of [...callbacks]) try {
			callback(request.url);
		} catch (error) {
			console.error("Desktop browser link handler failed", error);
		}
	});
	return {
		acquire: (workspace) => electron.ipcRenderer.invoke(DESKTOP_IPC.browserAcquire, workspace),
		release: (lease) => electron.ipcRenderer.invoke(DESKTOP_IPC.browserRelease, lease),
		onOpenRequested(lease, listener) {
			let callbacks = listeners.get(lease);
			if (callbacks === void 0) {
				callbacks = /* @__PURE__ */ new Set();
				listeners.set(lease, callbacks);
			}
			callbacks.add(listener);
			return () => {
				callbacks.delete(listener);
				if (callbacks.size === 0 && listeners.get(lease) === callbacks) listeners.delete(lease);
			};
		}
	};
}
//#endregion
//#region lib/types/preload-app.js
/** Origin-scoped boot, native directory selection, host paths of picked files, and update presentation with native confirmation actions. */
function createProductApi() {
	return {
		protocolVersion: 1,
		browser: createDesktopBrowserBridge(),
		deviceInfo: () => electron.ipcRenderer.invoke(DESKTOP_IPC.deviceInfo),
		keyboard: {
			closeWindow: (revision) => electron.ipcRenderer.invoke(DESKTOP_IPC.shortcutsCloseWindow, revision),
			subscribe: (listener) => {
				const handle = (_event, input) => {
					if (input.kind === "iframe") {
						const element = document.activeElement;
						if (!(element instanceof HTMLIFrameElement) || !element.isConnected || !element.matches("iframe[data-sidebar-browser-frame], iframe[data-html-preview]")) return;
						if (input.frameName === "" || element.name !== input.frameName) return;
					}
					if (input.kind === "webview") {
						const element = document.activeElement;
						if (element?.matches("webview[data-sidebar-browser-frame]") !== true || !element.isConnected || input.frameName === "" || element.getAttribute("name") !== input.frameName) return;
					}
					listener(input);
				};
				electron.ipcRenderer.on(DESKTOP_IPC.shortcutsInput, handle);
				return () => {
					electron.ipcRenderer.off(DESKTOP_IPC.shortcutsInput, handle);
				};
			}
		},
		shortcuts: {
			get: (definitions) => electron.ipcRenderer.invoke(DESKTOP_IPC.shortcutsGet, definitions),
			edit: (edit, revision) => electron.ipcRenderer.invoke(DESKTOP_IPC.shortcutsEdit, edit, revision),
			recording: (active) => electron.ipcRenderer.invoke(DESKTOP_IPC.shortcutsRecording, active),
			subscribe(listener) {
				const handle = (_event, snapshot) => {
					listener(snapshot);
				};
				electron.ipcRenderer.on(DESKTOP_IPC.shortcutsChanged, handle);
				return () => {
					electron.ipcRenderer.off(DESKTOP_IPC.shortcutsChanged, handle);
				};
			}
		},
		updates: {
			status: () => electron.ipcRenderer.invoke(DESKTOP_IPC.updatesStatus),
			open: () => electron.ipcRenderer.invoke(DESKTOP_IPC.updatesOpen),
			subscribe(listener) {
				const handle = (_event, state) => {
					listener(state);
				};
				electron.ipcRenderer.on(DESKTOP_IPC.updatesPresentation, handle);
				return () => {
					electron.ipcRenderer.off(DESKTOP_IPC.updatesPresentation, handle);
				};
			}
		}
	};
}
if (location.protocol === `dsh-app:` && location.hostname === "app") {
	electron.contextBridge.exposeInMainWorld("dshOnboarding", {
		hasApiKey: () => electron.ipcRenderer.invoke(DESKTOP_IPC.onboardingApiKey),
		setActive: (active) => {
			electron.ipcRenderer.send(DESKTOP_IPC.onboardingActive, active);
		}
	});
	electron.ipcRenderer.on(DESKTOP_IPC.enterWorkspace, () => {
		const body = document.body;
		const previous = body.getAttribute("tabindex");
		body.tabIndex = -1;
		body.focus({ preventScroll: true });
		if (previous === null) body.removeAttribute("tabindex");
		else body.setAttribute("tabindex", previous);
	});
	syncWindowsAppearance();
	if (process.platform === "win32") installMandatoryUpdateOverlay();
	electron.contextBridge.exposeInMainWorld("__DSH_DIRECTORY_PICKER__", { pick: () => electron.ipcRenderer.invoke(DESKTOP_IPC.directoryPick) });
	electron.contextBridge.exposeInMainWorld("__DSH_HOST_PATHS__", { pathFor: (file) => electron.webUtils.getPathForFile(file) });
	electron.contextBridge.exposeInMainWorld("dshDesktopBoot", {
		ready: () => electron.ipcRenderer.invoke(DESKTOP_IPC.boot),
		failed: (message) => electron.ipcRenderer.invoke(DESKTOP_IPC.bootFailed, message)
	});
	electron.contextBridge.exposeInMainWorld("dshPlatform", {
		open: (page, bounds) => electron.ipcRenderer.invoke(PLATFORM_IPC.open, page, bounds),
		setBounds: (bounds) => electron.ipcRenderer.invoke(PLATFORM_IPC.bounds, bounds),
		close: () => electron.ipcRenderer.invoke(PLATFORM_IPC.close)
	});
}
markDocumentPlatform();
syncWindowFullscreen();
syncNativeTheme();
electron.contextBridge.exposeInMainWorld("dshDesktop", location.protocol === `dsh-app:` && location.hostname === "app" && process.isMainFrame ? createProductApi() : { protocolVersion: 1 });
if (location.protocol === `dsh-app:` && location.hostname === "app") electron.contextBridge.exposeInMainWorld("__DSH_LOCALE__", {
	read: () => electron.ipcRenderer.invoke(DESKTOP_IPC.localeBootstrap),
	onChange: (locale) => {
		electron.ipcRenderer.send(DESKTOP_IPC.localeChanged, locale);
	}
});
//#endregion
