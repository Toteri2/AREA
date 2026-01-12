export const ApkDownloadButton = ({
  filePath = '/app-release.apk',
  fileName = 'client.apk',
  label = 'Download app',
}) => {
  return (
    <a
      href={filePath}
      download={fileName}
      style={{
        padding: '10px 16px',
        backgroundColor: '#1976d2',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '6px',
        fontWeight: 'bold',
        display: 'inline-block',
      }}
    >
      {label}
    </a>
  );
};
