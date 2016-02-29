using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(GoogleMapsExample.Startup))]
namespace GoogleMapsExample
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
