<script>
  import GenericForm from './GenericForm.svelte'

  export let credentials
  export let existingCredentials
  export let disableSave

  credentials = { ...existingCredentials }

  let opts = [
    {
      id: 'name',
      label: 'Database Name',
      type: 'text',
      optional: false,
      placeholder: 'mydatabase',
      value: credentials.name ?? ''
    },
    {
      id: 'workgroup',
      label: 'Workgroup',
      type: 'text',
      optional: true,
      placeholder: 'primary',
      value: credentials.workgroup ?? ''
    },
    {
      id: 's3_location',
      label: 'S3 query output location',
      type: 'text',
      optional: true,
      placeholder: 's3://my-bucket/folder',
      value: credentials.s3_location ?? ''
    },
    {
      id: 'region',
      label: 'AWS region',
      type: 'text',
      optional: true,
      placeholder: 'us-east-1',
      value: credentials.region ?? ''
    },
    {
      id: 'accessKeyId',
      label: 'AWS Access Key ID',
      type: 'text',
      optional: true,
      placeholder: 'AKIAIOSFODNN7EXAMPLE',
      additionalInstructions: 'If left blank, it will try to pick them up from your environment if available',
      value: credentials.accessKeyId ?? ''
    },
    {
      id: 'secretAccessKey',
      label: 'AWS Secret Access Key',
      type: 'password',
      optional: true,
      placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      additionalInstructions: 'If left blank, it will try to pick them up from your environment if available',
      value: credentials.secretAccessKey ?? ''
    },
    {
      id: 'sessionToken',
      label: 'AWS Access Key ID',
      type: 'password',
      optional: true,
      placeholder: 'AQoDYXdzEJr...',
      additionalInstructions: 'If left blank, it will try to pick them up from your environment if available',
      value: credentials.sessionToken ?? ''
    }
  ]
</script>

<GenericForm {opts} bind:credentials bind:disableSave />
