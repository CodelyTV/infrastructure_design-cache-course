vcl 4.0;
import std;

backend default {
    .host = "host.docker.internal";
    .port = "3000";
}

sub vcl_recv {
    if (req.method == "GET") {
        unset req.http.cookie;
    }
}

sub vcl_backend_response {
    if (beresp.http.Cache-Control ~ "s-maxage=(\d+)") {
        set beresp.ttl = std.duration(regsub(beresp.http.Cache-Control, ".*s-maxage=(\d+).*", "\1s"), 0s);
    } else {
        # set beresp.ttl = 60s;
    }
}
