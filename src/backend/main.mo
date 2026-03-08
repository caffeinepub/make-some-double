import Set "mo:core/Set";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";

actor {
  type Job = {
    prefix : Text;
    leftSerial : Nat;
    rightSerial : Nat;
  };

  module Job {
    public func compare(a : Job, b : Job) : Order.Order {
      switch (Text.compare(a.prefix, b.prefix)) {
        case (#less) { #less };
        case (#greater) { #greater };
        case (#equal) {
          switch (Nat.compare(a.leftSerial, b.leftSerial)) {
            case (#less) { #less };
            case (#greater) { #greater };
            case (#equal) {
              Nat.compare(a.rightSerial, b.rightSerial);
            };
          };
        };
      };
    };
  };

  let jobs = Set.empty<Job>();

  var settings : Text = "";

  public shared ({ caller }) func submitJob(prefix : Text, leftSerial : Nat, rightSerial : Nat) : async () {
    let job = {
      prefix;
      leftSerial;
      rightSerial;
    };
    if (jobs.contains(job)) {
      Runtime.trap("Job already exists!");
    };
    jobs.add(job);
  };

  public shared ({ caller }) func setSettings(newSettings : Text) : async () {
    settings := newSettings;
  };

  public query ({ caller }) func getAllJobs() : async [Job] {
    jobs.values().toArray();
  };

  public query ({ caller }) func getSettings() : async Text {
    settings;
  };
};
