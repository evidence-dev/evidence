export async function get() {
    const time = new Date()
    return {
        body: {
          time
        }
    };
  }