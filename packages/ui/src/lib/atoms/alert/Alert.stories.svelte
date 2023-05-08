<script>
    import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
    import Alert from "./Alert.svelte";
  </script>
  
  <Meta
    title="Example/Alert"
    component={Alert}
    argTypes={{
        content: { control: "text" },
        status: { 
            options: ["default", "info", "danger", "success", "warning"],
            control: {
                labels: {
                    default: "Default",
                    info: "Info",
                    danger: "Danger",
                    success: "Success",
                    warning: "Warning"
                }
            }
        },
        sticky: {
            control: "boolean"
        }
    }}
    args={{
        content: "Hello world!",
        sticky: false
    }}
  />
  
  <Template let:args>
    <Alert {...args} on:click={args.onClick}>{args.content}</Alert>
  </Template>
  
  <Story
    name="Default"
  />

  <Story
  name="Info"
args={{ status: "info" }}
    />