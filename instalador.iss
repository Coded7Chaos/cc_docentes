#define AppName "Simple Test Server"
#define AppVersion "1.0.0"
#define AppPublisher "Nicole Rodas"
#define AppExeName "main.exe"
#define BuildDir "dist/main"

[Setup]
; ID único generado para esta app (evita conflictos con otras instalaciones)
AppId={{E1A2B3C4-D5E6-4F7A-8B9C-0D1E2F3A4B5C}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\{#AppName}
DisableProgramGroupPage=yes
DefaultGroupName={#AppName}
; Permitir al usuario crear un icono en el escritorio
AllowNoIcons=yes
; Icono del instalador
SetupIconFile=backend\icono.ico
; Dónde se guardará el instalador generado
OutputDir=.\output
OutputBaseFilename=SimpleTestServer_Setup
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}";

[Files]
; 1. Indicamos el .exe principal
Source: "{#BuildDir}\{#AppExeName}"; DestDir: "{app}"; Flags: ignoreversion

; 2. Copiamos ABSOLUTAMENTE TODO lo que está dentro de dist\main (incluyendo la carpeta frontend que PyInstaller ya puso ahí adentro)
Source: "{#BuildDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExeName}"

[Run]
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(AppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
// Función auxiliar para buscar dónde está instalado el programa viejo
function GetUninstallString(): String;
var
  sUnInstPath: String;
  sRegistryKey: String;
begin
  sUnInstPath := '';
  // Esto lee el AppId real de la sección [Setup] de forma automática
  sRegistryKey := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{#SetupSetting("AppId")}_is1'; 
  
  // Busca primero en la instalación global, si no, en la del usuario actual
  if not RegQueryStringValue(HKLM, sRegistryKey, 'UninstallString', sUnInstPath) then
    RegQueryStringValue(HKCU, sRegistryKey, 'UninstallString', sUnInstPath);
    
  Result := sUnInstPath;
end;

// Evento que se dispara automáticamente cuando el instalador cambia de paso
procedure CurStepChanged(CurStep: TSetupStep);
var
  sUnInstallString: String;
  iResultCode: Integer;
begin
  // ssInstall es el momento exacto ANTES de empezar a copiar los archivos nuevos
  if CurStep = ssInstall then 
  begin
    sUnInstallString := GetUninstallString();
    
    // Si encontró una versión anterior...
    if sUnInstallString <> '' then
    begin
      // Limpiamos las comillas de la ruta
      sUnInstallString := RemoveQuotes(sUnInstallString);
      
      // Ejecutamos el desinstalador viejo de forma 100% silenciosa y oculta (SW_HIDE)
      if Exec(sUnInstallString, '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART', '', SW_HIDE, ewWaitUntilTerminated, iResultCode) then
      begin
        // Desinstalación exitosa, el instalador nuevo continuará automáticamente
      end;
    end;
  end;
end;
