import React, { useCallback, useEffect, useRef, useState } from 'react';

// material ui
import { Button, Divider, Drawer, IconButton } from '@mui/material';
import { Close as CloseIcon, CloudUpload, FileCopyOutlined as CopyPasteIcon } from '@mui/icons-material';

import Editor, { loader } from '@monaco-editor/react';

import { createFileDownload } from '../../../helpers';
import Loader from '../../common/loader';
import Dropzone from 'react-dropzone';

loader.config({ paths: { vs: '/ui/vs' } });

const editorProps = {
  defaultLanguage: 'xml',
  height: 700,
  language: 'xml',
  loading: <Loader show />,
  options: {
    autoClosingOvertype: 'auto',
    codeLens: false,
    contextmenu: false,
    enableSplitViewResizing: false,
    formatOnPaste: true,
    lightbulb: { enabled: false },
    lineNumbers: 'off',
    minimap: { enabled: false },
    quickSuggestions: false,
    readOnly: true,
    renderOverviewRuler: false,
    scrollBeyondLastLine: false,
    wordWrap: 'on'
  }
};

export const SSOEditor = ({ config, fileContent, hasSSOConfig, open, onCancel, onClose, onSave, setFileContent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMetadataValid, setIsMetadataValid] = useState(false);
  const editorRef = useRef();

  useEffect(() => {
    if (!fileContent) {
      return;
    }
    const parser = new DOMParser();
    const theDom = parser.parseFromString(fileContent, 'application/xml');
    setIsMetadataValid(!theDom.getElementsByTagName('parsererror').length);
  }, [fileContent]);

  const onEditClick = () => setIsEditing(true);

  const onDownloadClick = () => createFileDownload(fileContent, 'metadata.xml');

  const onCancelClick = useCallback(() => {
    if (isEditing) {
      setFileContent(config);
      if (!hasSSOConfig) {
        return onCancel();
      }
      return setIsEditing(false);
    }
    onCancel();
  }, [config, isEditing, onCancel]);

  const onSubmitClick = () => {
    onSave();
    setIsEditing(false);
  };

  const onDrop = acceptedFiles => {
    let reader = new FileReader();
    reader.fileName = acceptedFiles[0].name;
    reader.onerror = error => {
      console.log('Error: ', error);
      setIsEditing(false);
    };
    reader.onload = () => {
      setFileContent(reader.result);
      setIsEditing(true);
    };
    reader.readAsBinaryString(acceptedFiles[0]);
  };

  const handleEditorDidMount = (editor, monaco) => {
    monaco.languages.html.registerHTMLLanguageService('xml', {}, { documentFormattingEdits: true });
    editorRef.current = { editor, monaco, modifiedEditor: editor };
  };

  return (
    <Drawer className={`${open ? 'fadeIn' : 'fadeOut'}`} anchor="right" open={open} onClose={onClose} PaperProps={{ style: { minWidth: '75vw' } }}>
      <div className="flexbox margin-bottom-small space-between">
        <h3>SAML metadata</h3>
        <div className="flexbox center-aligned">
          <Dropzone multiple={false} onDrop={onDrop}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Button color="secondary" startIcon={<CloudUpload fontSize="small" />}>
                  Import from a file
                </Button>
              </div>
            )}
          </Dropzone>

          <IconButton onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </div>
      </div>
      <Divider light />
      <Editor
        {...editorProps}
        options={{
          ...editorProps.options,
          readOnly: hasSSOConfig && !isEditing
        }}
        className="editor modified"
        onChange={setFileContent}
        onMount={handleEditorDidMount}
        value={fileContent}
      />
      {!isMetadataValid && fileContent.length > 4 && <div className="error">There was an error parsing the metadata.</div>}
      <Divider className="margin-top-large margin-bottom" light />
      <div>
        {hasSSOConfig && !isEditing ? (
          <div className="flexbox center-aligned">
            <Button onClick={onEditClick}>Edit</Button>
            <Button onClick={onDownloadClick}>Download file</Button>
            <Button startIcon={<CopyPasteIcon />}>Copy to clipboard</Button>
          </div>
        ) : (
          <>
            <Button onClick={onCancelClick}>Cancel</Button>
            <Button variant="contained" disabled={!isMetadataValid} onClick={onSubmitClick} color="secondary" style={{ marginLeft: 10 }}>
              Save
            </Button>
          </>
        )}
      </div>
    </Drawer>
  );
};

export default SSOEditor;